import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Job from '@/models/Job';
import Application from '@/models/Application';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;

        const job = await Job.findById(id).populate('recruiter', 'name email companyName').lean();
        if (!job) {
            return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
        }

        const applicantCount = await Application.countDocuments({ job: id });

        return NextResponse.json({
            success: true,
            data: {
                ...job,
                applicantCount
            }
        });
    } catch (error) {
        console.error('GET /api/jobs/[id] error:', error);
        return NextResponse.json({ error: 'Failed to retrieve job.' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const body = await req.json();
        const updated = await Job.findByIdAndUpdate(id, { $set: body }, { new: true });

        if (!updated) {
            return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('PATCH /api/jobs/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update job.' }, { status: 500 });
    }
}
