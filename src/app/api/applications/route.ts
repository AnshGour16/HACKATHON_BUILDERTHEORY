import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Application from '@/models/Application';
import Job from '@/models/Job';
import CandidateProfile from '@/models/CandidateProfile';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { evaluateCandidateApplicationWithGemini } from '@/lib/recruitment-evaluator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/applications
 * Returns applications:
 * - If recruiter: applications for their jobs (or all if admin)
 * - If candidate: their submitted applications
 */
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get('jobId');
        const stage = searchParams.get('stage');

        const isRecruiterOrAdmin = user.role === 'ADMIN' || user.role === 'JUDGE' || user.role === 'RECRUITER';

        if (isRecruiterOrAdmin) {
            const query: Record<string, unknown> = {};

            if (jobId && jobId !== 'ALL') {
                query.job = jobId;
            } else if (user.role === 'RECRUITER') {
                const recruiterJobs = await Job.find({ recruiter: user._id }).select('_id');
                query.job = { $in: recruiterJobs.map(j => j._id) };
            }

            if (stage && stage !== 'ALL') {
                query.status = stage;
            }

            const applications = await Application.find(query)
                .sort({ matchScore: -1, createdAt: -1 })
                .populate('candidate', 'name email avatarUrl phone')
                .populate('candidateProfile', 'headline location parsedSkills experience education resumeFileName githubUrl')
                .populate('job', 'title companyName department evaluationType status')
                .lean();

            return NextResponse.json({
                success: true,
                count: applications.length,
                data: applications
            });
        } else {
            // Candidate: return their own applications
            const applications = await Application.find({ candidate: user._id })
                .sort({ appliedAt: -1 })
                .populate('job', 'title companyName department location jobType evaluationType status')
                .lean();

            return NextResponse.json({
                success: true,
                count: applications.length,
                data: applications
            });
        }
    } catch (error) {
        console.error('GET /api/applications error:', error);
        return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
    }
}

/**
 * POST /api/applications
 * Candidate applies for a job vacancy.
 * Automatically runs Gemini all-industry evaluation and practical evidence check.
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        const body = await req.json();
        const {
            jobId,
            githubUrl,
            githubRepoUrl,
            assignmentSubmission,
            resumeText,
            candidateEmail,
            candidateName,
            candidatePhone,
            coverLetter
        } = body;

        let user = session?.user?.email
            ? await User.findOne({ email: session.user.email })
            : null;

        if (!user && candidateEmail) {
            const cleanEmail = candidateEmail.toLowerCase().trim();
            user = await User.findOne({ email: cleanEmail });
            if (!user) {
                const hashedPassword = await bcrypt.hash('candidate123', 10);
                user = await User.create({
                    email: cleanEmail,
                    name: candidateName || 'Candidate',
                    phone: candidatePhone,
                    role: 'CANDIDATE',
                    password: hashedPassword
                });
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Please provide your email address or sign in to apply.' }, { status: 401 });
        }

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return NextResponse.json({ error: 'Job opening not found.' }, { status: 404 });
        }

        let profile = await CandidateProfile.findOne({ user: user._id });
        if (!profile && resumeText) {
            profile = await CandidateProfile.create({
                user: user._id,
                resumeText,
                githubUrl: githubUrl || githubRepoUrl
            });
        }

        // Check if candidate already applied to this job
        const existingApp = await Application.findOne({ job: job._id, candidate: user._id });
        if (existingApp) {
            return NextResponse.json({
                error: 'You have already submitted an application for this position.'
            }, { status: 409 });
        }

        const effectiveGithub = githubUrl || githubRepoUrl || profile?.githubUrl;
        const effectiveResume = resumeText || profile?.resumeText;

        // Run Gemini evaluation
        const evaluation = await evaluateCandidateApplicationWithGemini({
            job,
            candidateProfile: profile,
            resumeText: effectiveResume,
            githubUrl: effectiveGithub,
            assignmentSubmission
        });

        const newApp = await Application.create({
            job: job._id,
            candidate: user._id,
            candidateProfile: profile?._id,
            status: 'APPLIED',
            stageOrder: 1,
            resumeFileName: profile?.resumeFileName,
            githubUrl: effectiveGithub,
            assignmentSubmission,
            coverLetter,
            matchScore: evaluation.overallMatchScore,
            aiEvaluation: evaluation,
            appliedAt: new Date()
        });

        // Increment applicant count on job
        await Job.updateOne({ _id: job._id }, { $inc: { candidateCount: 1 } });

        return NextResponse.json({
            success: true,
            message: 'Application submitted and evaluated successfully!',
            data: newApp,
            evaluation
        }, { status: 201 });
    } catch (error) {
        console.error('POST /api/applications error:', error);
        return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
    }
}
