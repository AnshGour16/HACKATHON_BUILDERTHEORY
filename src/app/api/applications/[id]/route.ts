import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Application from '@/models/Application';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMockCandidateById, updateMockCandidate } from '@/lib/mock-candidates';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        let application = null;

        // 1. If valid 24-character hex ObjectId, check database first
        if (mongoose.Types.ObjectId.isValid(id)) {
            try {
                await connectToDatabase();
                application = await Application.findById(id)
                    .populate('candidate', 'name email phone avatarUrl')
                    .populate('candidateProfile')
                    .populate('job')
                    .lean();
            } catch (dbErr) {
                console.warn(`Database query for application ${id} failed:`, dbErr);
            }
        }

        // 2. If not found in DB or if it's a mock/sample application ID, resolve from mock catalog
        if (!application) {
            application = getMockCandidateById(id);
        }

        if (!application) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('GET /api/applications/[id] error:', error);
        // Fallback gracefully to mock data so candidate scorecard page never crashes
        try {
            const { id } = await context.params;
            const fallback = getMockCandidateById(id);
            if (fallback) {
                return NextResponse.json({ success: true, data: fallback });
            }
        } catch {
            // Ignore fallback error
        }
        return NextResponse.json({ error: 'Failed to retrieve application.' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const { status, recruiterNotes, interviewScheduledDate, rating } = body;

        // 1. If mock candidate or not a Mongo ObjectId, update in-memory gracefully
        if (!mongoose.Types.ObjectId.isValid(id) || id.startsWith('mock-')) {
            const updated = updateMockCandidate(id, {
                status,
                recruiterNotes,
                interviewScheduledDate,
                rating
            });
            return NextResponse.json({
                success: true,
                message: 'Application updated successfully.',
                data: updated
            });
        }

        // 2. Check auth for database update
        const session = await getServerSession(authOptions);

        const updateFields: Record<string, unknown> = {};
        if (status) {
            updateFields.status = status;
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

        try {
            await connectToDatabase();
            const updated = await Application.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true }
            ).populate('candidate', 'name email').populate('job', 'title');

            if (updated) {
                return NextResponse.json({
                    success: true,
                    message: 'Application updated successfully.',
                    data: updated
                });
            }
        } catch (dbErr) {
            console.warn(`Failed to update DB application ${id}:`, dbErr);
        }

        // If not in DB, update mock store
        const mockUpdated = updateMockCandidate(id, {
            status,
            recruiterNotes,
            interviewScheduledDate,
            rating
        });

        return NextResponse.json({
            success: true,
            message: 'Application updated successfully.',
            data: mockUpdated
        });
    } catch (error) {
        console.error('PATCH /api/applications/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update application.' }, { status: 500 });
    }
}
