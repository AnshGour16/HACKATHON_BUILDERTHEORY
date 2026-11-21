import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Application from '@/models/Application';
import Job from '@/models/Job';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateRecruiterCopilotInsights } from '@/lib/recruitment-evaluator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const body = await req.json();
        const { query, jobId } = body;

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
        }

        let jobTitle = 'All Positions';
        const appQuery: Record<string, unknown> = {};

        if (jobId && jobId !== 'ALL') {
            const job = await Job.findById(jobId);
            if (job) {
                jobTitle = job.title;
                appQuery.job = job._id;
            }
        }

        const applications = await Application.find(appQuery)
            .populate('candidate', 'name email')
            .populate('candidateProfile', 'parsedSkills headline')
            .limit(20)
            .lean();

        interface IPopulatedApp {
            candidate?: { name?: string; email?: string };
            candidateProfile?: { parsedSkills?: string[]; headline?: string };
            status: string;
            matchScore?: number;
            aiEvaluation?: { summary?: string };
        }

        const candidateSummaries = (applications as unknown as IPopulatedApp[]).map((app) => ({
            name: app.candidate?.name || 'Candidate',
            matchScore: app.matchScore || 0,
            skills: app.candidateProfile?.parsedSkills || [],
            status: app.status,
            summary: app.aiEvaluation?.summary || app.candidateProfile?.headline
        }));

        const answer = await generateRecruiterCopilotInsights({
            query: query.trim(),
            jobTitle,
            candidates: candidateSummaries
        });

        return NextResponse.json({
            success: true,
            reply: answer
        });
    } catch (error) {
        console.error('POST /api/recruiter/copilot error:', error);
        return NextResponse.json({ error: 'Failed to generate copilot response.' }, { status: 500 });
    }
}
