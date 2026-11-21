import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import '@/models/Team'; // To populate references
import '@/models/Hackathon';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateDefaultHackathon } from '@/lib/hackathon-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        await getOrCreateDefaultHackathon();

        // Check authentication and admin role
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

        const { searchParams } = new URL(req.url);
        const hackathonId = searchParams.get('hackathonId');

        const filter: Record<string, unknown> = {};
        if (hackathonId && hackathonId !== 'ALL') {
            filter.hackathon = hackathonId;
        }

        // Fetch submissions and populate the team and hackathon info
        const submissions = await Submission.find(filter)
            .populate('team', 'name projectTitle problemStatement track githubUrl githubStatus githubScore hackathon isShortlisted shortlistRank shortlistedAt finalScore finalRank isWinner winnerPosition')
            .populate('hackathon', 'name slug theme shortlistingStatus shortlistLimit shortlistingMode shortlistedAt shortlistCount pitchWeight githubWeight isFinalResultsPublished winnerCount finalResultsPublishedAt')
            .sort({ createdAt: -1 })
            .lean(); // Faster to use lean for read-only

        // Privacy Guard: If caller is NOT an admin, mask final rankings and winner statuses for unpublished hackathons
        if (!isAdmin) {
            for (const sub of (submissions as Array<Record<string, unknown>>)) {
                const hackathon = sub.hackathon as { isFinalResultsPublished?: boolean } | null;
                const isPublished = Boolean(hackathon?.isFinalResultsPublished);

                if (!isPublished) {
                    delete sub.finalScore;
                    delete sub.finalRank;
                    delete sub.finalScoreBreakdown;
                    sub.isWinner = false;
                    delete sub.winnerPosition;

                    if (sub.team && typeof sub.team === 'object') {
                        const team = sub.team as Record<string, unknown>;
                        delete team.finalScore;
                        delete team.finalRank;
                        team.isWinner = false;
                        delete team.winnerPosition;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, count: submissions.length, data: submissions });
    } catch (error: unknown) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}
