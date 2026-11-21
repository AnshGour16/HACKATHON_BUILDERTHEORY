import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Team from '@/models/Team';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import '@/models/Hackathon';

export const dynamic = 'force-dynamic';

interface IUserSubmissionTeam {
    _id: unknown;
    name: string;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    hackathon?: {
        isFinalResultsPublished?: boolean;
        finalResultsPublishedAt?: Date;
        winnerCount?: number;
    };
    [key: string]: unknown;
}

interface IUserSubmissionDoc {
    _id: unknown;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    [key: string]: unknown;
}

export async function GET() {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        // Find the team where this user is the verified leader
        const team = await Team.findOne({ leader: user._id })
            .populate('hackathon', 'name slug theme description isCodeSubmissionOpen codeSubmissionDeadline shortlistingStatus shortlistCount blindJudgingEnabled isFinalResultsPublished finalResultsPublishedAt winnerCount pitchWeight githubWeight')
            .lean() as unknown as IUserSubmissionTeam | null;

        if (!team) {
            return NextResponse.json({
                success: true,
                team: null,
                submission: null,
                message: "No team registered for this account."
            });
        }

        // Find the submission for this team
        const submission = await Submission.findOne({ team: team._id })
            .populate('hackathon', 'name slug theme isFinalResultsPublished')
            .lean() as unknown as IUserSubmissionDoc | null;

        const isPublished = Boolean(team.hackathon?.isFinalResultsPublished);

        // Privacy Guard: If organizer has NOT published final results, mask final rank and winner status
        if (!isPublished) {
            if (team) {
                team.finalRank = undefined;
                team.isWinner = false;
                team.winnerPosition = undefined;
            }
            if (submission) {
                submission.finalRank = undefined;
                submission.isWinner = false;
                submission.winnerPosition = undefined;
            }
        }

        return NextResponse.json({
            success: true,
            team,
            submission
        });

    } catch (error: unknown) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Server error'
        }, { status: 500 });
    }
}
