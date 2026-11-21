import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import '@/models/Team';
import '@/models/Hackathon';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Next 15 awaits params
        await connectToDatabase();

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

        const submission = await Submission.findById(id)
            .populate('team')
            .populate('hackathon', 'name slug theme isFinalResultsPublished')
            .lean() as Record<string, unknown> | null;

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Privacy Guard: If caller is not admin and hackathon results are not published, mask final rankings
        if (!isAdmin) {
            const hackathon = submission.hackathon as { isFinalResultsPublished?: boolean } | null;
            const isPublished = Boolean(hackathon?.isFinalResultsPublished);

            if (!isPublished) {
                delete submission.finalScore;
                delete submission.finalRank;
                delete submission.finalScoreBreakdown;
                submission.isWinner = false;
                delete submission.winnerPosition;

                if (submission.team && typeof submission.team === 'object') {
                    const team = submission.team as Record<string, unknown>;
                    delete team.finalScore;
                    delete team.finalRank;
                    team.isWinner = false;
                    delete team.winnerPosition;
                }
            }
        }

        return NextResponse.json({ success: true, data: submission });
    } catch (error: unknown) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}
