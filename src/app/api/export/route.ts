import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import '@/models/Team';
import Hackathon from '@/models/Hackathon';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface IExportSubmission {
    _id?: string;
    finalRank?: number;
    finalScore?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    team?: {
        name?: string;
        track?: string;
        projectTitle?: string;
        problemStatement?: string;
        members?: { name: string }[];
        isShortlisted?: boolean;
        shortlistRank?: number;
        shortlistedAt?: string | Date;
        finalScore?: number;
        finalRank?: number;
        isWinner?: boolean;
        winnerPosition?: number;
    };
    hackathon?: {
        name?: string;
        pitchWeight?: number;
        githubWeight?: number;
    };
    status?: string;
    aiEvaluation?: {
        totalScore?: number;
        strengths?: string[];
        weaknesses?: string[];
        missingSections?: string[];
        plagiarismFlag?: boolean;
    };
    githubEvaluation?: {
        technicalScore?: number;
        status?: string;
        repoUrl?: string;
    };
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const hackathonId = searchParams.get('hackathonId');
        const limitParam = searchParams.get('limit');
        const shortlistedOnly = searchParams.get('shortlistedOnly') === 'true';
        const finalRanking = searchParams.get('finalRanking') === 'true';
        const trackParam = searchParams.get('track');

        const filter: Record<string, unknown> = {};
        if (hackathonId && hackathonId !== 'ALL') {
            filter.hackathon = hackathonId;
        }

        // Privacy Guard: Non-admin users cannot export final rankings unless published
        if (finalRanking) {
            let isAdmin = false;
            try {
                const session = await getServerSession(authOptions);
                if (session?.user?.email) {
                    const user = await User.findOne({ email: session.user.email }).lean() as { role?: string } | null;
                    if (user?.role === 'ADMIN' || session.user.email === 'admin@hackathon.com') {
                        isAdmin = true;
                    }
                }
            } catch {
                isAdmin = false;
            }

            if (!isAdmin) {
                if (!hackathonId || hackathonId === 'ALL') {
                    return NextResponse.json({
                        error: 'Forbidden: Only organizers can export unpublished or global final rankings.'
                    }, { status: 403 });
                }
                const hackathon = await Hackathon.findById(hackathonId).lean() as { isFinalResultsPublished?: boolean } | null;
                if (!hackathon?.isFinalResultsPublished) {
                    return NextResponse.json({
                        error: 'Forbidden: Final rankings have not been published by the organizer.'
                    }, { status: 403 });
                }
            }
        }

        let query = Submission.find(filter)
            .populate('team', 'name projectTitle problemStatement track members isShortlisted shortlistRank shortlistedAt finalScore finalRank isWinner winnerPosition')
            .populate('hackathon', 'name pitchWeight githubWeight')
            .sort(finalRanking ? { finalRank: 1, finalScore: -1, 'aiEvaluation.totalScore': -1 } : { 'aiEvaluation.totalScore': -1, createdAt: -1 });

        if (limitParam) {
            const limit = parseInt(limitParam, 10);
            if (!isNaN(limit) && limit > 0) {
                query = query.limit(limit);
            }
        }

        let submissions = await query.lean() as unknown as IExportSubmission[];

        // Apply in-memory team filters if needed
        if (finalRanking) {
            submissions = submissions.filter(s => (s.finalRank !== undefined || s.finalScore !== undefined || s.githubEvaluation?.status === 'EVALUATED'));
            submissions.sort((a, b) => (a.finalRank || 9999) - (b.finalRank || 9999));
        } else if (shortlistedOnly) {
            submissions = submissions.filter(s => s.team?.isShortlisted);
        }

        if (trackParam && trackParam !== 'ALL') {
            submissions = submissions.filter(s => s.team?.track?.toLowerCase() === trackParam.toLowerCase());
        }

        // CSV Header
        const headers = finalRanking ? [
            'Rank',
            'Hackathon',
            'Team Name',
            'Project Title',
            'Track',
            'GitHub Repository',
            'Technical Score',
            'Code Quality (25)',
            'Technical Implementation (25)',
            'Architecture (20)',
            'Testing & Errors (15)',
            'Documentation & Dev (15)',
            'Winner Status',
            'AI Summary'
        ] : [
            'Rank',
            'Hackathon',
            'Team Name',
            'Project Title',
            'Track',
            'Total Score',
            'Shortlist Status',
            'Shortlist Rank',
            'Qualified At',
            'Problem Statement',
            'Member Count',
            'Evaluation Status',
            'Plagiarism Flag'
        ];

        // Format rows
        const rows = (submissions || []).map((sub, idx) => {
            const team = sub.team || {};
            const hackathon = sub.hackathon || {};
            const evalData = sub.aiEvaluation || {};
            const gitData = (sub.githubEvaluation || {}) as {
                technicalScore?: number;
                status?: string;
                repoUrl?: string;
                breakdown?: {
                    codeQualityMaintainability?: number;
                    codeQuality?: number;
                    technicalImplementation?: number;
                    architectureProjectStructure?: number;
                    architecture?: number;
                    testingErrorHandling?: number;
                    documentationAndTesting?: number;
                    documentationDevPractices?: number;
                    developmentActivity?: number;
                };
                summary?: string;
                technicalSummary?: string;
            };
            const isShortlisted = Boolean(team.isShortlisted);
            const shortlistRank = team.shortlistRank ? `#${team.shortlistRank}` : '-';
            const qualifiedAt = team.shortlistedAt ? new Date(team.shortlistedAt).toLocaleDateString() : '-';

            if (finalRanking) {
                const finalRankDisplay = sub.finalRank || team.finalRank || idx + 1;
                const winnerDisplay = team.isWinner
                    ? `WINNER (Position #${team.winnerPosition || 1})`
                    : (finalRankDisplay <= 3 ? `Top ${finalRankDisplay} Finalist` : 'Participant');

                const bd = gitData.breakdown || {};
                const cq = bd.codeQualityMaintainability ?? bd.codeQuality ?? 'N/A';
                const ti = bd.technicalImplementation ?? 'N/A';
                const ar = bd.architectureProjectStructure ?? bd.architecture ?? 'N/A';
                const te = bd.testingErrorHandling ?? bd.documentationAndTesting ?? 'N/A';
                const dd = bd.documentationDevPractices ?? bd.developmentActivity ?? 'N/A';
                const summary = (gitData.technicalSummary || gitData.summary || '').replace(/"/g, '""');

                return [
                    finalRankDisplay,
                    hackathon.name || 'Global',
                    team.name || 'Unknown',
                    (team.projectTitle || '').replace(/"/g, '""'),
                    team.track || 'General',
                    gitData.repoUrl || 'N/A',
                    gitData.technicalScore !== undefined ? gitData.technicalScore : (team.finalScore !== undefined ? team.finalScore : 'N/A'),
                    cq,
                    ti,
                    ar,
                    te,
                    dd,
                    winnerDisplay,
                    summary
                ].map(String).map(item => `"${item}"`).join(',');
            }

            return [
                idx + 1,
                hackathon.name || 'Global',
                team.name || 'Unknown',
                (team.projectTitle || '').replace(/"/g, '""'),
                team.track || 'General',
                evalData.totalScore !== undefined ? evalData.totalScore : 0,
                isShortlisted ? 'SHORTLISTED' : 'NOT SHORTLISTED',
                shortlistRank,
                qualifiedAt,
                (team.problemStatement || '').replace(/"/g, '""'),
                team.members?.length || 0,
                sub.status || 'PENDING',
                evalData.plagiarismFlag ? 'YES' : 'NO'
            ].map(String).map(item => `"${item}"`).join(',');
        });

        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
        const filename = finalRanking
            ? 'hackathon_final_leaderboard.csv'
            : (shortlistedOnly ? 'shortlisted_teams.csv' : 'hackathon_leaderboard.csv');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error: unknown) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
