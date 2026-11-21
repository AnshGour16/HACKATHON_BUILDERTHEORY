import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Hackathon from '@/models/Hackathon';
import Team from '@/models/Team';
import Submission from '@/models/Submission';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface ICalculatedRankedTeam {
    teamId: string;
    teamName: string;
    projectTitle?: string;
    track: string;
    submissionId: string;
    pitchScore: number;
    githubScore: number;
    pitchWeight: number;
    githubWeight: number;
    finalScore: number;
    finalRank: number;
    createdAt: Date;
    isWinner?: boolean;
    winnerPosition?: number;
}

interface IHackathonDocLean {
    _id: mongoose.Types.ObjectId;
    name: string;
    pitchWeight?: number;
    githubWeight?: number;
    isFinalResultsPublished?: boolean;
    finalResultsPublishedAt?: Date;
    finalResultsPublishedBy?: string;
    winnerCount?: number;
    finalRankingRecalculatedAt?: Date;
    rankingHistory?: Array<{
        calculatedAt: Date;
        pitchWeight: number;
        githubWeight: number;
        rankedTeamCount: number;
        topTeamId?: mongoose.Types.ObjectId;
    }>;
    [key: string]: unknown;
}

interface ITeamDocLean {
    _id: mongoose.Types.ObjectId;
    name: string;
    projectTitle?: string;
    track: string;
    finalScore?: number;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    shortlistRank?: number;
    createdAt: Date;
    [key: string]: unknown;
}

interface ISubmissionDocLean {
    _id: mongoose.Types.ObjectId;
    team: mongoose.Types.ObjectId;
    status?: string;
    createdAt: Date;
    aiEvaluation?: {
        totalScore?: number;
        [key: string]: unknown;
    };
    githubEvaluation?: {
        status?: string;
        technicalScore?: number;
        repoUrl?: string;
        [key: string]: unknown;
    };
    finalScore?: number;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    finalScoreBreakdown?: {
        pitchScore: number;
        pitchWeight: number;
        githubScore: number;
        githubWeight: number;
        pitchContribution?: number;
        githubContribution?: number;
    };
    [key: string]: unknown;
}

/**
 * Deterministic tie-breaker for final ranking:
 * 1. Final Composite Score (desc)
 * 2. GitHub Technical Score (desc)
 * 3. Pitch Deck Score (desc)
 * 4. Submission CreatedAt (asc)
 * 5. Team ID (asc)
 */
function sortRankingsDeterministically(a: ICalculatedRankedTeam, b: ICalculatedRankedTeam): number {
    const scoreDiff = b.finalScore - a.finalScore;
    if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;

    const gitDiff = b.githubScore - a.githubScore;
    if (gitDiff !== 0) return gitDiff;

    const pitchDiff = b.pitchScore - a.pitchScore;
    if (pitchDiff !== 0) return pitchDiff;

    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (dateA !== dateB) return dateA - dateB;

    return String(a.teamId).localeCompare(String(b.teamId));
}

/**
 * GET /api/hackathons/[id]/final-rankings
 * Returns current final ranking status, weight settings, publication state, and all shortlisted teams.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const hackathon = await Hackathon.findById(id).lean() as unknown as IHackathonDocLean | null;
        if (!hackathon) {
            return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
        }

        const shortlistedTeams = await Team.find({ hackathon: id, isShortlisted: true })
            .sort({ finalRank: 1, shortlistRank: 1 })
            .lean() as unknown as ITeamDocLean[];

        const teamIds = shortlistedTeams.map(t => t._id);
        const submissions = await Submission.find({ hackathon: id, team: { $in: teamIds } })
            .lean() as unknown as ISubmissionDocLean[];

        const subMap = new Map<string, ISubmissionDocLean>();
        submissions.forEach(s => subMap.set(String(s.team), s));

        const teamEvaluations = shortlistedTeams.map(team => {
            const sub = subMap.get(String(team._id));
            const hasPitch = sub?.status === 'EVALUATED' && typeof sub.aiEvaluation?.totalScore === 'number';
            const hasGithub = sub?.githubEvaluation?.status === 'EVALUATED' && typeof sub.githubEvaluation?.technicalScore === 'number';
            const isGithubFailed = sub?.githubEvaluation?.status === 'FAILED';

            let evalStatus: 'COMPLETE' | 'PENDING_CODE' | 'FAILED_CODE' | 'PENDING_PITCH' = 'PENDING_PITCH';
            if (hasPitch && hasGithub) {
                evalStatus = 'COMPLETE';
            } else if (hasPitch && isGithubFailed) {
                evalStatus = 'FAILED_CODE';
            } else if (hasPitch) {
                evalStatus = 'PENDING_CODE';
            }

            return {
                teamId: String(team._id),
                teamName: team.name,
                projectTitle: team.projectTitle,
                track: team.track,
                shortlistRank: team.shortlistRank,
                submissionId: sub ? String(sub._id) : null,
                pitchScore: hasPitch && sub?.aiEvaluation?.totalScore !== undefined ? sub.aiEvaluation.totalScore : null,
                githubScore: hasGithub && sub?.githubEvaluation?.technicalScore !== undefined ? sub.githubEvaluation.technicalScore : null,
                githubRepoUrl: sub?.githubEvaluation?.repoUrl || team.githubUrl || null,
                githubStatus: sub?.githubEvaluation?.status || team.githubStatus || 'NOT_SUBMITTED',
                finalScore: team.finalScore !== undefined ? team.finalScore : (sub?.finalScore !== undefined ? sub.finalScore : null),
                finalRank: team.finalRank !== undefined ? team.finalRank : (sub?.finalRank !== undefined ? sub.finalRank : null),
                isWinner: Boolean(team.isWinner || sub?.isWinner),
                winnerPosition: team.winnerPosition || sub?.winnerPosition || null,
                evalStatus,
                createdAt: sub?.createdAt || team.createdAt
            };
        });

        // Compute summary counts
        const completedCount = teamEvaluations.filter(t => t.evalStatus === 'COMPLETE').length;
        const pendingCodeCount = teamEvaluations.filter(t => t.evalStatus === 'PENDING_CODE').length;
        const failedCodeCount = teamEvaluations.filter(t => t.evalStatus === 'FAILED_CODE').length;

        const topWinners = teamEvaluations
            .filter(t => t.isWinner && t.winnerPosition)
            .sort((a, b) => (a.winnerPosition || 99) - (b.winnerPosition || 99));

        return NextResponse.json({
            success: true,
            hackathon: {
                _id: hackathon._id,
                name: hackathon.name,
                pitchWeight: hackathon.pitchWeight ?? 40,
                githubWeight: hackathon.githubWeight ?? 60,
                isFinalResultsPublished: Boolean(hackathon.isFinalResultsPublished),
                finalResultsPublishedAt: hackathon.finalResultsPublishedAt || null,
                finalResultsPublishedBy: hackathon.finalResultsPublishedBy || null,
                winnerCount: hackathon.winnerCount ?? 3,
                finalRankingRecalculatedAt: hackathon.finalRankingRecalculatedAt || null,
                rankingHistory: hackathon.rankingHistory || []
            },
            stats: {
                totalShortlisted: shortlistedTeams.length,
                completedCount,
                pendingCodeCount,
                failedCodeCount,
                isPublished: Boolean(hackathon.isFinalResultsPublished)
            },
            topWinners,
            rankings: teamEvaluations
        });

    } catch (error: unknown) {
        console.error('[API Final Rankings GET] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}

/**
 * POST /api/hackathons/[id]/final-rankings
 * Actions:
 * 1. calculate / preview: compute weighted composite scores and assign final ranks.
 * 2. publish: publish confirmed final results and declare winners.
 * 3. unpublish: retract published status for further review or weight tweaking.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        // Admin authentication required
        let session = null;
        try {
            session = await getServerSession(authOptions);
        } catch {
            session = null;
        }

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in as an organizer.' }, { status: 401 });
        }

        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Only hackathon organizers can configure final rankings.' }, { status: 403 });
        }

        const hackathon = await Hackathon.findById(id);
        if (!hackathon) {
            return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
        }

        const body = await req.json();
        const { action = 'calculate', preview = false, pitchWeight = 40, githubWeight = 60, winnerCount = 3 } = body;

        // -------------------------------------------------------------
        // ACTION: PUBLISH
        // -------------------------------------------------------------
        if (action === 'publish') {
            if (!hackathon.finalRankingRecalculatedAt) {
                return NextResponse.json({
                    error: 'Final composite scores must be calculated before publishing winners.'
                }, { status: 400 });
            }

            const parsedWinnerCount = Math.max(1, Math.min(20, Number(winnerCount) || 3));

            // Fetch ranked teams in descending rank order
            const rankedTeams = await Team.find({
                hackathon: id,
                isShortlisted: true,
                finalRank: { $exists: true }
            }).sort({ finalRank: 1 });

            if (rankedTeams.length === 0) {
                return NextResponse.json({
                    error: 'No ranked teams available to declare as winners. Ensure completed evaluations exist.'
                }, { status: 400 });
            }

            // Clear previous winner flags
            await Team.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });
            await Submission.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });

            // Assign winners
            const winningTeamIds: mongoose.Types.ObjectId[] = [];
            for (let i = 0; i < Math.min(parsedWinnerCount, rankedTeams.length); i++) {
                const team = rankedTeams[i];
                const position = i + 1;
                team.isWinner = true;
                team.winnerPosition = position;
                await team.save();
                winningTeamIds.push(team._id);

                await Submission.findOneAndUpdate(
                    { hackathon: id, team: team._id },
                    { $set: { isWinner: true, winnerPosition: position } }
                );
            }

            hackathon.isFinalResultsPublished = true;
            hackathon.finalResultsPublishedAt = new Date();
            hackathon.finalResultsPublishedBy = session.user.email;
            hackathon.winnerCount = parsedWinnerCount;
            await hackathon.save();

            return NextResponse.json({
                success: true,
                message: `Successfully declared and published Top ${parsedWinnerCount} winners!`,
                winnerCount: parsedWinnerCount,
                publishedAt: hackathon.finalResultsPublishedAt
            });
        }

        // -------------------------------------------------------------
        // ACTION: UNPUBLISH
        // -------------------------------------------------------------
        if (action === 'unpublish') {
            hackathon.isFinalResultsPublished = false;
            await hackathon.save();

            return NextResponse.json({
                success: true,
                message: 'Final results have been unpublished. Participants can no longer see final ranks.'
            });
        }

        // -------------------------------------------------------------
        // ACTION: CALCULATE / PREVIEW
        // -------------------------------------------------------------
        const pw = Number(pitchWeight);
        const gw = Number(githubWeight);

        if (isNaN(pw) || isNaN(gw) || pw < 0 || gw < 0 || (pw + gw) !== 100) {
            return NextResponse.json({
                error: 'Invalid weights: Pitch Deck weight and GitHub weight must each be between 0% and 100%, and sum to exactly 100%.'
            }, { status: 400 });
        }

        // Fetch all shortlisted teams
        const shortlistedTeams = await Team.find({ hackathon: id, isShortlisted: true }).lean() as unknown as ITeamDocLean[];
        if (shortlistedTeams.length === 0) {
            return NextResponse.json({
                error: 'No shortlisted teams found for this hackathon. Run Round 1 shortlisting first.'
            }, { status: 400 });
        }

        const teamIds = shortlistedTeams.map(t => t._id);
        const submissions = await Submission.find({ hackathon: id, team: { $in: teamIds } }).lean() as unknown as ISubmissionDocLean[];

        const subMap = new Map<string, ISubmissionDocLean>();
        submissions.forEach(s => subMap.set(String(s.team), s));

        const eligibleCandidates: ICalculatedRankedTeam[] = [];
        const incompleteTeams: { teamId: string; teamName: string; reason: string }[] = [];

        shortlistedTeams.forEach(team => {
            const sub = subMap.get(String(team._id));
            const hasPitch = sub?.status === 'EVALUATED' && typeof sub.aiEvaluation?.totalScore === 'number';
            const hasGithub = sub?.githubEvaluation?.status === 'EVALUATED' && typeof sub.githubEvaluation?.technicalScore === 'number';

            if (!sub) {
                incompleteTeams.push({ teamId: String(team._id), teamName: team.name, reason: 'No presentation uploaded' });
                return;
            }

            if (!hasPitch) {
                incompleteTeams.push({ teamId: String(team._id), teamName: team.name, reason: 'Pitch deck evaluation pending or failed' });
                return;
            }

            if (!hasGithub) {
                const gitStatus = sub.githubEvaluation?.status || 'PENDING';
                incompleteTeams.push({
                    teamId: String(team._id),
                    teamName: team.name,
                    reason: gitStatus === 'FAILED' ? 'GitHub evaluation failed' : 'GitHub submission pending'
                });
                return;
            }

            const pitchScore = sub.aiEvaluation?.totalScore ?? 0;
            const githubScore = sub.githubEvaluation?.technicalScore ?? 0;

            // Final Score Formula: (Pitch Score * Pitch Weight) + (GitHub Score * GitHub Weight)
            const rawFinalScore = (pitchScore * (pw / 100)) + (githubScore * (gw / 100));
            const finalScore = Math.round(rawFinalScore * 100) / 100; // Round to 2 decimals

            eligibleCandidates.push({
                teamId: String(team._id),
                teamName: team.name,
                projectTitle: team.projectTitle,
                track: team.track,
                submissionId: String(sub._id),
                pitchScore,
                githubScore,
                pitchWeight: pw,
                githubWeight: gw,
                finalScore,
                finalRank: 0,
                createdAt: sub.createdAt || team.createdAt
            });
        });

        // Deterministic ranking
        eligibleCandidates.sort(sortRankingsDeterministically);

        // Assign final ranks
        eligibleCandidates.forEach((candidate, idx) => {
            candidate.finalRank = idx + 1;
        });

        // If preview mode, return calculated results without database writes
        if (preview || action === 'preview') {
            return NextResponse.json({
                success: true,
                preview: true,
                weights: { pitchWeight: pw, githubWeight: gw },
                totalShortlisted: shortlistedTeams.length,
                eligibleCount: eligibleCandidates.length,
                incompleteCount: incompleteTeams.length,
                rankings: eligibleCandidates,
                incompleteTeams
            });
        }

        // Commit final ranking to MongoDB atomically
        const now = new Date();
        const completeTeamIds: mongoose.Types.ObjectId[] = [];

        for (const candidate of eligibleCandidates) {
            const tId = new mongoose.Types.ObjectId(candidate.teamId);
            completeTeamIds.push(tId);

            await Team.findByIdAndUpdate(tId, {
                $set: {
                    finalScore: candidate.finalScore,
                    finalRank: candidate.finalRank
                }
            });

            await Submission.findByIdAndUpdate(candidate.submissionId, {
                $set: {
                    finalScore: candidate.finalScore,
                    finalRank: candidate.finalRank,
                    finalScoreBreakdown: {
                        pitchScore: candidate.pitchScore,
                        pitchWeight: pw,
                        githubScore: candidate.githubScore,
                        githubWeight: gw
                    }
                }
            });
        }

        // Clean up incomplete teams so stale ranks don't remain
        await Team.updateMany(
            { hackathon: id, _id: { $nin: completeTeamIds } },
            { $unset: { finalScore: '', finalRank: '', isWinner: '', winnerPosition: '' } }
        );

        await Submission.updateMany(
            { hackathon: id, team: { $nin: completeTeamIds } },
            { $unset: { finalScore: '', finalRank: '', finalScoreBreakdown: '', isWinner: '', winnerPosition: '' } }
        );

        // Update Hackathon
        hackathon.pitchWeight = pw;
        hackathon.githubWeight = gw;
        hackathon.finalRankingRecalculatedAt = now;

        if (!hackathon.rankingHistory) hackathon.rankingHistory = [];
        hackathon.rankingHistory.push({
            calculatedAt: now,
            pitchWeight: pw,
            githubWeight: gw,
            topTeamName: eligibleCandidates[0]?.teamName || 'N/A'
        });

        await hackathon.save();

        return NextResponse.json({
            success: true,
            message: `Final composite rankings successfully calculated and committed to MongoDB for ${eligibleCandidates.length} eligible teams.`,
            weights: { pitchWeight: pw, githubWeight: gw },
            totalShortlisted: shortlistedTeams.length,
            rankedCount: eligibleCandidates.length,
            incompleteCount: incompleteTeams.length,
            recalculatedAt: now,
            rankings: eligibleCandidates
        });

    } catch (error: unknown) {
        console.error('[API Final Rankings POST] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}
