import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import '@/models/Team';
import '@/models/Hackathon';

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
            submissions = submissions.filter(s => s.team?.isShortlisted && (s.finalRank !== undefined || s.finalScore !== undefined));
            submissions.sort((a, b) => (a.finalRank || 9999) - (b.finalRank || 9999));
        } else if (shortlistedOnly) {
            submissions = submissions.filter(s => s.team?.isShortlisted);
        }

        if (trackParam && trackParam !== 'ALL') {
            submissions = submissions.filter(s => s.team?.track?.toLowerCase() === trackParam.toLowerCase());
        }

        // CSV Header
        const headers = finalRanking ? [
            'Final Rank',
            'Hackathon',
            'Team Name',
            'Project Title',
            'Track',
            'Pitch Deck Score (R1)',
            'GitHub Score (R2)',
            'Final Composite Score',
            'Winner Status',
            'Problem Statement'
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
            const gitData = sub.githubEvaluation || {};
            const isShortlisted = Boolean(team.isShortlisted);
            const shortlistRank = team.shortlistRank ? `#${team.shortlistRank}` : '-';
            const qualifiedAt = team.shortlistedAt ? new Date(team.shortlistedAt).toLocaleDateString() : '-';

            if (finalRanking) {
                const finalRankDisplay = sub.finalRank || team.finalRank || idx + 1;
                const winnerDisplay = team.isWinner
                    ? `WINNER (Position #${team.winnerPosition || 1})`
                    : (finalRankDisplay <= 3 ? `Top ${finalRankDisplay} Finalist` : 'Finalist');

                return [
                    finalRankDisplay,
                    hackathon.name || 'Global',
                    team.name || 'Unknown',
                    (team.projectTitle || '').replace(/"/g, '""'),
                    team.track || 'General',
                    evalData.totalScore !== undefined ? evalData.totalScore : 'N/A',
                    gitData.technicalScore !== undefined ? gitData.technicalScore : 'N/A',
                    sub.finalScore !== undefined ? sub.finalScore : (team.finalScore !== undefined ? team.finalScore : 'N/A'),
                    winnerDisplay,
                    (team.problemStatement || '').replace(/"/g, '""')
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
