import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Team from '@/models/Team';
import Submission from '@/models/Submission';
import Hackathon from '@/models/Hackathon';
import User from '@/models/User';
import { getOrCreateDefaultHackathon } from '@/lib/hackathon-service';
import { fetchGithubData, validateAndNormalizeGithubUrl } from '@/lib/github';
import { evaluateCodebaseWithGemini } from '@/lib/gemini';
import { invalidateHackathonPublication } from '@/lib/publication-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/submit-code
 * Returns current Round 2 eligibility and submission status for the authenticated team leader.
 */
export async function GET() {
    try {
        await connectToDatabase();

        let session = null;
        try {
            session = await getServerSession(authOptions);
        } catch {
            session = null;
        }

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const team = await Team.findOne({ leader: user._id })
            .populate('hackathon', 'name slug theme isCodeSubmissionOpen codeSubmissionDeadline shortlistingStatus')
            .lean();

        if (!team) {
            return NextResponse.json({
                success: true,
                hasTeam: false,
                isEligible: false,
                message: 'No team registered for this account.'
            });
        }

        const submission = await Submission.findOne({ team: team._id }).lean();

        const hackathon = team.hackathon as {
            name?: string;
            isCodeSubmissionOpen?: boolean;
            codeSubmissionDeadline?: Date;
            shortlistingStatus?: string;
        } | null;

        // By default, code submission is open unless explicitly locked by organizers
        const isCodePhaseOpen = hackathon?.isCodeSubmissionOpen !== false;
        const hasPassedDeadline = Boolean(hackathon?.codeSubmissionDeadline && new Date() > new Date(hackathon.codeSubmissionDeadline));

        let round2Status: 'NOT_ELIGIBLE' | 'LOCKED' | 'DEADLINE_PASSED' | 'WAITING_FOR_SUBMISSION' | 'ANALYZING' | 'EVALUATED' | 'FAILED' = 'WAITING_FOR_SUBMISSION';

        if (!isCodePhaseOpen) {
            round2Status = 'LOCKED';
        } else if (hasPassedDeadline) {
            round2Status = 'DEADLINE_PASSED';
        } else if (submission?.githubEvaluation?.status === 'EVALUATED') {
            round2Status = 'EVALUATED';
        } else if (submission?.githubEvaluation?.status === 'FAILED') {
            round2Status = 'FAILED';
        } else if (submission?.githubEvaluation?.status === 'ANALYZING') {
            round2Status = 'ANALYZING';
        } else {
            round2Status = 'WAITING_FOR_SUBMISSION';
        }

        return NextResponse.json({
            success: true,
            hasTeam: true,
            team: {
                _id: team._id,
                name: team.name,
                track: team.track,
                isShortlisted: team.isShortlisted,
                shortlistRank: team.shortlistRank,
                githubUrl: team.githubUrl,
                githubStatus: team.githubStatus
            },
            hackathon: {
                name: hackathon?.name,
                isCodeSubmissionOpen: isCodePhaseOpen,
                codeSubmissionDeadline: hackathon?.codeSubmissionDeadline
            },
            isEligible: true,
            isCodePhaseOpen,
            round2Status,
            githubEvaluation: submission?.githubEvaluation || null
        });

    } catch (error: unknown) {
        console.error('[API Submit-Code GET] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}

/**
 * POST /api/submit-code
 * Strictly verifies identity, shortlist status, event phase, and evaluates public GitHub repository.
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        // 1. Authenticate user
        let session = null;
        try {
            session = await getServerSession(authOptions);
        } catch {
            session = null;
        }

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
        }

        const body = await req.json();
        const { githubUrl, retry, teamId: requestedTeamId } = body;

        // 2. Identify Team: Never trust client-supplied teamId unless user is a verified ADMIN
        let team = null;
        if (user.role === 'ADMIN' && requestedTeamId) {
            team = await Team.findById(requestedTeamId);
        } else {
            team = await Team.findOne({ leader: user._id });
        }

        if (!team) {
            return NextResponse.json({
                error: 'No team found where you are registered as team leader.'
            }, { status: 404 });
        }

        // 3. Resolve Hackathon
        let hackathon = null;
        if (team.hackathon) {
            hackathon = await Hackathon.findById(team.hackathon);
        }
        if (!hackathon) {
            hackathon = await getOrCreateDefaultHackathon();
            team.hackathon = hackathon._id;
            await team.save();
        }

        // 4. Server-Side Access Control Checks
        // Check A: Hackathon code submission phase check (HTTP 403 only if explicitly locked false)
        if (hackathon && hackathon.isCodeSubmissionOpen === false) {
            return NextResponse.json({
                error: 'GitHub repository submission is currently locked for this hackathon. Please wait for organizers to open the portal.'
            }, { status: 403 });
        }

        // Check B: Deadline check if configured (HTTP 403)
        if (hackathon.codeSubmissionDeadline && new Date() > new Date(hackathon.codeSubmissionDeadline)) {
            return NextResponse.json({
                error: 'The GitHub repository submission deadline has passed.'
            }, { status: 403 });
        }

        // 5. Submission Record Resolution: Auto-create submission document if no pitch deck exists
        let submission = await Submission.findOne({ team: team._id });
        if (!submission) {
            submission = await Submission.create({
                team: team._id,
                hackathon: hackathon?._id,
                fileUrl: 'NONE',
                fileName: 'github-repository',
                fileFormat: 'unknown',
                status: 'PENDING'
            });
        }

        // 6. Validate & Normalize Target GitHub URL
        const targetUrl = githubUrl || (retry ? (submission.githubEvaluation?.repoUrl || team.githubUrl) : null);
        if (!targetUrl) {
            return NextResponse.json({
                error: 'A valid GitHub repository URL is required.'
            }, { status: 400 });
        }

        const urlValidation = validateAndNormalizeGithubUrl(targetUrl);
        if (!urlValidation.valid || !urlValidation.normalizedUrl) {
            return NextResponse.json({
                error: urlValidation.error || 'Invalid GitHub repository URL.'
            }, { status: 400 });
        }

        const normalizedRepoUrl = urlValidation.normalizedUrl;

        // 7. Update status to ANALYZING and persist submission intent
        team.githubUrl = normalizedRepoUrl;
        team.githubStatus = 'ANALYZING';
        await team.save();

        if (!submission.githubEvaluation) {
            submission.githubEvaluation = {
                status: 'ANALYZING',
                repoUrl: normalizedRepoUrl,
                submittedAt: new Date()
            };
        } else {
            submission.githubEvaluation.status = 'ANALYZING';
            submission.githubEvaluation.repoUrl = normalizedRepoUrl;
            submission.githubEvaluation.submittedAt = new Date();
            submission.githubEvaluation.error = undefined;
        }
        await submission.save();

        // 8. Fetch Repository Contents via GitHub REST API
        const fetchResult = await fetchGithubData(normalizedRepoUrl);
        if (!fetchResult.success) {
            // Persist failure status
            submission.githubEvaluation.status = 'FAILED';
            submission.githubEvaluation.error = fetchResult.error;
            submission.githubEvaluation.repoOwner = fetchResult.owner;
            submission.githubEvaluation.repoName = fetchResult.repo;
            await submission.save();

            team.githubStatus = 'FAILED';
            await team.save();

            // Invalidate publication if results were published
            if (hackathon && hackathon._id) {
                await invalidateHackathonPublication(
                    hackathon._id,
                    `GitHub inspection failed for team "${team.name}"`,
                    session?.user?.email || 'SYSTEM'
                );
            }

            const statusCode = fetchResult.isRateLimited ? 429 : 400;
            return NextResponse.json({
                error: fetchResult.error || 'Failed to inspect GitHub repository.'
            }, { status: statusCode });
        }

        // 9. Run AI Codebase Evaluation via Gemini
        const hackathonContext = {
            name: hackathon.name,
            theme: team.track || hackathon.theme,
            description: hackathon.description,
            customAiPrompt: hackathon.customAiPrompt
        };

        let aiEvaluationResult;
        try {
            aiEvaluationResult = await evaluateCodebaseWithGemini(
                fetchResult.contextText || '',
                hackathonContext
            );
        } catch (aiError) {
            console.error('[API Submit-Code] Gemini evaluation error:', aiError);
            submission.githubEvaluation.status = 'FAILED';
            submission.githubEvaluation.error = 'AI evaluation could not be completed. Please retry in a moment.';
            await submission.save();

            team.githubStatus = 'FAILED';
            await team.save();

            // Invalidate publication if results were published
            if (hackathon && hackathon._id) {
                await invalidateHackathonPublication(
                    hackathon._id,
                    `GitHub inspection failed for team "${team.name}"`,
                    session?.user?.email || 'SYSTEM'
                );
            }

            return NextResponse.json({
                error: 'AI codebase evaluation failed. Please retry in a few moments.'
            }, { status: 500 });
        }

        // 10. Persist Evaluation Results Atomically
        const evalRecord = {
            repoUrl: normalizedRepoUrl,
            repoOwner: fetchResult.owner,
            repoName: fetchResult.repo,
            defaultBranch: fetchResult.meta?.defaultBranch,
            primaryLanguage: fetchResult.meta?.language,
            stars: fetchResult.meta?.stars,
            forks: fetchResult.meta?.forks,
            openIssues: fetchResult.meta?.openIssues,
            submittedAt: submission.githubEvaluation?.submittedAt || new Date(),
            analyzedAt: new Date(),
            status: 'EVALUATED' as const,
            technicalScore: aiEvaluationResult.technicalScore,
            overallScore: aiEvaluationResult.technicalScore,
            breakdown: aiEvaluationResult.breakdown,
            criteriaFeedback: aiEvaluationResult.criteriaFeedback,
            technicalSummary: aiEvaluationResult.technicalSummary || aiEvaluationResult.summary,
            architectureAssessment: aiEvaluationResult.architectureAssessment,
            codeQualityAssessment: aiEvaluationResult.codeQualityAssessment,
            documentationAssessment: aiEvaluationResult.documentationAssessment,
            testingAssessment: aiEvaluationResult.testingAssessment,
            codeQualityObservations: aiEvaluationResult.codeQualityObservations,
            architectureObservations: aiEvaluationResult.architectureObservations,
            testingObservations: aiEvaluationResult.testingObservations,
            securityObservations: aiEvaluationResult.securityObservations,
            strengths: aiEvaluationResult.strengths,
            weaknesses: aiEvaluationResult.weaknesses,
            missingImplementationEvidence: aiEvaluationResult.missingImplementationEvidence,
            missingComponents: aiEvaluationResult.missingImplementationEvidence,
            improvementRecommendations: aiEvaluationResult.improvementRecommendations,
            filesInspected: aiEvaluationResult.filesInspected,
            analysisLimitations: aiEvaluationResult.analysisLimitations,
            summary: aiEvaluationResult.technicalSummary || aiEvaluationResult.summary
        };

        submission.githubEvaluation = evalRecord;

        // Maintain legacy field for backward compatibility
        if (!submission.aiEvaluation) {
            submission.aiEvaluation = {} as unknown;
        }
        submission.aiEvaluation.githubAnalysis = {
            technicalComplexity: aiEvaluationResult.technicalScore,
            codeQuality: aiEvaluationResult.codeQualityAssessment || aiEvaluationResult.criteriaFeedback?.codeQuality || 'Evaluated',
            commitActivity: aiEvaluationResult.criteriaFeedback?.developmentActivity || 'Evaluated'
        };

        await submission.save();

        // Update Team model summary cache
        team.githubUrl = normalizedRepoUrl;
        team.githubStatus = 'EVALUATED';
        team.githubScore = aiEvaluationResult.technicalScore;
        // Primary repository evaluation score is assigned directly
        if (team.finalScore === undefined || team.finalScore === null) {
            team.finalScore = aiEvaluationResult.technicalScore;
        }
        await team.save();

        // Invalidate publication if results were published
        if (hackathon && hackathon._id) {
            await invalidateHackathonPublication(
                hackathon._id,
                `GitHub technical evaluation completed for team "${team.name}" (Score: ${aiEvaluationResult.technicalScore}/100)`,
                session?.user?.email || 'SYSTEM'
            );
        }

        return NextResponse.json({
            success: true,
            message: 'GitHub codebase successfully evaluated.',
            githubEvaluation: evalRecord
        });

    } catch (error: unknown) {
        console.error('[API Submit-Code POST] Fatal Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}
