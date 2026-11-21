import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Hackathon from '@/models/Hackathon';
import Team from '@/models/Team';
import Submission from '@/models/Submission';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invalidateHackathonPublication } from '@/lib/publication-service';

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
    lastCalculatedPitchWeight?: number;
    lastCalculatedGithubWeight?: number;
    isFinalResultsPublished?: boolean;
    finalResultsPublishedAt?: Date;
    finalResultsPublishedBy?: string;
    finalResultsInvalidatedAt?: Date;
    finalResultsInvalidationReason?: string;
    winnerCount?: number;
    finalRankingRecalculatedAt?: Date;
    rankingHistory?: Array<{
        version: number;
        calculatedAt: Date;
        pitchWeight: number;
        githubWeight: number;
        rankedTeamCount: number;
        incompleteTeamCount?: number;
        topTeamName?: string;
        topTeamScore?: number;
    }>;
    publicationHistory?: Array<{
        action: string;
        timestamp: Date;
        performedBy: string;
        winnerCount?: number;
        reason?: string;
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
 * 5-STAGE DETERMINISTIC TIE-BREAKING ALGORITHM FOR FINAL COMPOSITE RANKINGS:
 * 
 * When two or more teams achieve similar standing, ranks are decided strictly in the
 * following deterministic order:
 * 
 * 1. Final Composite Score (descending)
 *    The primary ranking criterion: (Pitch Score * Pitch Weight) + (GitHub Score * GitHub Weight).
 *    Score differences > 0.0001 break ties immediately.
 * 
 * 2. GitHub Technical Score (descending)
 *    If final composite scores are tied within floating-point tolerance (0.0001), the team with
 *    the higher Round 2 GitHub technical evaluation score is ranked higher.
 * 
 * 3. Pitch Deck Score (descending)
 *    If GitHub technical scores are also identical, the team with the higher Round 1 pitch deck
 *    evaluation score is ranked higher.
 * 
 * 4. Submission CreatedAt Timestamp (ascending)
 *    If both round scores are identical, the team with the earlier submission timestamp
 *    (first-come advantage) is ranked higher.
 * 
 * 5. Team ID Lexicographical Comparison (ascending)
 *    If all four criteria above are equal, the unique 24-character hexadecimal MongoDB ObjectId
 *    string (String(a.teamId).localeCompare(String(b.teamId))) is compared lexicographically.
 * 
 * TOTAL ORDERING GUARANTEE (Zero Arbitrary/Random Ordering):
 * In MongoDB, every team document possesses an immutable, globally unique ObjectId (_id).
 * Therefore, for two distinct teams A and B, String(a.teamId) === String(b.teamId) can never occur.
 * This mathematically ensures a strict, non-random total ordering over all candidates, eliminating
 * non-deterministic sorting or arbitrary reordering across multiple runs.
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
                lastCalculatedPitchWeight: hackathon.lastCalculatedPitchWeight,
                lastCalculatedGithubWeight: hackathon.lastCalculatedGithubWeight,
                isFinalResultsPublished: Boolean(hackathon.isFinalResultsPublished),
                finalResultsPublishedAt: hackathon.finalResultsPublishedAt || null,
                finalResultsPublishedBy: hackathon.finalResultsPublishedBy || null,
                finalResultsInvalidatedAt: hackathon.finalResultsInvalidatedAt || null,
                finalResultsInvalidationReason: hackathon.finalResultsInvalidationReason || null,
                winnerCount: hackathon.winnerCount ?? 3,
                finalRankingRecalculatedAt: hackathon.finalRankingRecalculatedAt || null,
                rankingHistory: hackathon.rankingHistory || [],
                publicationHistory: hackathon.publicationHistory || []
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

            // Safeguard 1: Invalidation check
            if (hackathon.finalResultsInvalidatedAt && (!hackathon.finalRankingRecalculatedAt || new Date(hackathon.finalRankingRecalculatedAt) <= new Date(hackathon.finalResultsInvalidatedAt))) {
                return NextResponse.json({
                    error: `Cannot publish: results were invalidated on ${new Date(hackathon.finalResultsInvalidatedAt).toISOString()} (${hackathon.finalResultsInvalidationReason || 'scores or weights modified'}). A fresh ranking calculation must be run before publishing.`
                }, { status: 400 });
            }

            // Safeguard 2: Weight consistency check
            if (
                hackathon.lastCalculatedPitchWeight === undefined ||
                hackathon.lastCalculatedGithubWeight === undefined ||
                hackathon.pitchWeight !== hackathon.lastCalculatedPitchWeight ||
                hackathon.githubWeight !== hackathon.lastCalculatedGithubWeight
            ) {
                return NextResponse.json({
                    error: `Cannot publish: rankings have not been calculated using the currently saved weights (${hackathon.pitchWeight}% pitch / ${hackathon.githubWeight}% GitHub). Current calculated weights: (${hackathon.lastCalculatedPitchWeight}% / ${hackathon.lastCalculatedGithubWeight}%). Please calculate rankings first.`
                }, { status: 400 });
            }

            // Safeguard 3: Check all shortlisted teams for completed evaluations
            const shortlistedTeams = await Team.find({ hackathon: id, isShortlisted: true }).lean() as unknown as ITeamDocLean[];
            if (shortlistedTeams.length === 0) {
                return NextResponse.json({
                    error: 'Cannot publish: no shortlisted teams found.'
                }, { status: 400 });
            }

            const teamIds = shortlistedTeams.map(t => t._id);
            const submissions = await Submission.find({ hackathon: id, team: { $in: teamIds } }).lean() as unknown as ISubmissionDocLean[];
            const subMap = new Map<string, ISubmissionDocLean>();
            submissions.forEach(s => subMap.set(String(s.team), s));

            const incompleteTeams: { teamId: string; teamName: string; reason: string }[] = [];
            for (const team of shortlistedTeams) {
                const sub = subMap.get(String(team._id));
                const hasPitch = sub?.status === 'EVALUATED' && typeof sub.aiEvaluation?.totalScore === 'number';
                const hasGithub = sub?.githubEvaluation?.status === 'EVALUATED' && typeof sub.githubEvaluation?.technicalScore === 'number';
                const isGithubFailed = sub?.githubEvaluation?.status === 'FAILED';

                if (!sub || !hasPitch) {
                    incompleteTeams.push({ teamId: String(team._id), teamName: team.name, reason: 'Pitch deck evaluation pending or missing' });
                } else if (isGithubFailed) {
                    incompleteTeams.push({ teamId: String(team._id), teamName: team.name, reason: 'GitHub evaluation failed' });
                } else if (!hasGithub) {
                    incompleteTeams.push({ teamId: String(team._id), teamName: team.name, reason: 'GitHub evaluation pending' });
                }
            }

            if (incompleteTeams.length > 0) {
                return NextResponse.json({
                    error: `Cannot publish: ${incompleteTeams.length} shortlisted team(s) have pending or failed evaluations. All shortlisted teams must have completed evaluations before final results can be published.`,
                    incompleteTeams
                }, { status: 400 });
            }

            // Safeguard 4: Valid saved rankings check
            const rankedTeams = await Team.find({
                hackathon: id,
                isShortlisted: true,
                finalRank: { $exists: true, $ne: null },
                finalScore: { $exists: true, $ne: null }
            }).sort({ finalRank: 1 });

            if (rankedTeams.length === 0) {
                return NextResponse.json({
                    error: 'Cannot publish: no valid saved rankings found. Please calculate rankings first.'
                }, { status: 400 });
            }

            // Safeguard 5: Winner count validation
            const parsedWinnerCount = Number(winnerCount);
            if (isNaN(parsedWinnerCount) || parsedWinnerCount < 1) {
                return NextResponse.json({
                    error: 'Winner count must be a positive integer of at least 1.'
                }, { status: 400 });
            }

            if (parsedWinnerCount > rankedTeams.length) {
                return NextResponse.json({
                    error: `Cannot publish: winnerCount (${parsedWinnerCount}) exceeds the number of eligible ranked teams (${rankedTeams.length}).`
                }, { status: 400 });
            }

            // Clear previous winner flags
            await Team.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });
            await Submission.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });

            // Assign winners
            const winningTeamIds: mongoose.Types.ObjectId[] = [];
            for (let i = 0; i < parsedWinnerCount; i++) {
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

            const now = new Date();
            hackathon.isFinalResultsPublished = true;
            hackathon.finalResultsPublishedAt = now;
            hackathon.finalResultsPublishedBy = session.user.email;
            hackathon.winnerCount = parsedWinnerCount;
            hackathon.finalResultsInvalidatedAt = undefined;
            hackathon.finalResultsInvalidationReason = undefined;

            if (!hackathon.publicationHistory) {
                hackathon.publicationHistory = [];
            }
            hackathon.publicationHistory.push({
                action: 'PUBLISH',
                timestamp: now,
                performedBy: session.user.email,
                winnerCount: parsedWinnerCount,
                reason: body.reason || `Published Top ${parsedWinnerCount} winners with ${rankedTeams.length} ranked teams`
            });

            await hackathon.save();

            return NextResponse.json({
                success: true,
                message: `Successfully declared and published Top ${parsedWinnerCount} winners!`,
                winnerCount: parsedWinnerCount,
                publishedAt: now
            });
        }

        // -------------------------------------------------------------
        // ACTION: UNPUBLISH
        // -------------------------------------------------------------
        if (action === 'unpublish') {
            const now = new Date();
            hackathon.isFinalResultsPublished = false;

            if (!hackathon.publicationHistory) {
                hackathon.publicationHistory = [];
            }
            hackathon.publicationHistory.push({
                action: 'UNPUBLISH',
                timestamp: now,
                performedBy: session.user.email,
                reason: body.reason || 'Organizer unpublished final results'
            });

            await hackathon.save();

            // Clear winner flags so participants cannot see winner status while unpublished
            await Team.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });
            await Submission.updateMany({ hackathon: id }, { $set: { isWinner: false, winnerPosition: undefined } });

            return NextResponse.json({
                success: true,
                message: 'Final results have been unpublished. Participants can no longer see final ranks or badges.'
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

        // If hackathon was published, calculating a fresh ranking immediately invalidates old publication
        if (hackathon.isFinalResultsPublished) {
            await invalidateHackathonPublication(
                id,
                `Rankings recalculated by organizer with weights ${pw}% pitch / ${gw}% GitHub`,
                session.user.email
            );
            hackathon.isFinalResultsPublished = false;
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
        hackathon.lastCalculatedPitchWeight = pw;
        hackathon.lastCalculatedGithubWeight = gw;
        hackathon.finalRankingRecalculatedAt = now;

        if (!hackathon.rankingHistory) hackathon.rankingHistory = [];
        const nextVersion = hackathon.rankingHistory.length + 1;
        hackathon.rankingHistory.push({
            version: nextVersion,
            calculatedAt: now,
            calculatedBy: session.user.email,
            pitchWeight: pw,
            githubWeight: gw,
            rankedTeamCount: eligibleCandidates.length,
            incompleteTeamCount: incompleteTeams.length,
            topTeamName: eligibleCandidates[0]?.teamName || 'N/A',
            topTeamScore: eligibleCandidates[0]?.finalScore ?? 0,
            reason: body.reason || 'Recalculated final rankings'
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
