import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
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

        const application = await Application.findById(id)
            .populate('candidate', 'name email phone avatarUrl')
            .populate('candidateProfile')
            .populate('job')
            .lean();

        if (!application) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('GET /api/applications/[id] error:', error);
        return NextResponse.json({ error: 'Failed to retrieve application.' }, { status: 500 });
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
        const { status, recruiterNotes, interviewScheduledDate, rating } = body;

        const updateFields: Record<string, unknown> = {};

        if (status) {
            updateFields.status = status;
            // Map stage to sequential integer order for Kanban sorting
            const stageOrders: Record<string, number> = {
                APPLIED: 1,
                SCREENING: 2,
                ASSESSMENT: 3,
                SHORTLISTED: 4,
                INTERVIEW: 5,
                OFFER: 6,
                HIRED: 7,
                REJECTED: 8
            };
            if (stageOrders[status]) {
                updateFields.stageOrder = stageOrders[status];
            }
        }
        if (recruiterNotes !== undefined) updateFields.recruiterNotes = recruiterNotes;
        if (interviewScheduledDate !== undefined) updateFields.interviewScheduledDate = interviewScheduledDate;
        if (rating !== undefined) updateFields.rating = rating;

        const updated = await Application.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        ).populate('candidate', 'name email').populate('job', 'title');

        if (!updated) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Application updated successfully.',
            data: updated
        });
    } catch (error) {
        console.error('PATCH /api/applications/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update application.' }, { status: 500 });
    }
}
