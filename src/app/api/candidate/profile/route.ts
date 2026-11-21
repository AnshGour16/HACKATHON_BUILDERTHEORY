import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        let profile = await CandidateProfile.findOne({ user: user._id }).lean();
        if (!profile) {
            // Auto-create blank profile if none exists yet
            profile = await CandidateProfile.create({
                user: user._id,
                headline: 'Candidate',
                parsedSkills: [],
                experience: [],
                education: []
            });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            profile
        });
    } catch (error) {
        console.error('GET /api/candidate/profile error:', error);
        return NextResponse.json({ error: 'Failed to fetch candidate profile.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const body = await req.json();
        const {
            name,
            phone,
            headline,
            location,
            bio,
            parsedSkills,
            experience,
            education,
            githubUrl,
            portfolioUrl,
            linkedinUrl
        } = body;

        // Update User name & phone if provided
        if (name || phone) {
            await User.updateOne({ _id: user._id }, {
                $set: {
                    ...(name ? { name: name.trim() } : {}),
                    ...(phone ? { phone: phone.trim() } : {})
                }
            });
        }

        const profile = await CandidateProfile.findOneAndUpdate(
            { user: user._id },
            {
                $set: {
                    headline,
                    phone,
                    location,
                    bio,
                    parsedSkills: Array.isArray(parsedSkills) ? parsedSkills : [],
                    experience: Array.isArray(experience) ? experience : [],
                    education: Array.isArray(education) ? education : [],
                    githubUrl,
                    portfolioUrl,
                    linkedinUrl
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Candidate profile updated successfully.',
            data: profile
        });
    } catch (error) {
        console.error('POST /api/candidate/profile error:', error);
        return NextResponse.json({ error: 'Failed to update candidate profile.' }, { status: 500 });
    }
}
