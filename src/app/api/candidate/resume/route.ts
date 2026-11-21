import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parsePdfPresentation } from '@/lib/pdf-parser';
import { parseResumeWithGemini } from '@/lib/recruitment-evaluator';

export const dynamic = 'force-dynamic';

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

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Resume PDF file is required.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Parse PDF buffer into text using our native pdf2json service
        let extractedText = '';
        try {
            const parsedDoc = await parsePdfPresentation(buffer);
            extractedText = parsedDoc.text || '';
        } catch {
            // Fallback plain utf8 or buffer slice if direct text extraction errors
            extractedText = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
        }

        if (!extractedText.trim()) {
            return NextResponse.json({ error: 'Could not extract readable text from this PDF resume.' }, { status: 422 });
        }

        // 2. Extract structured professional profile using Gemini AI
        const parsedData = await parseResumeWithGemini(extractedText);

        // 3. Update candidate profile in MongoDB
        const updatedProfile = await CandidateProfile.findOneAndUpdate(
            { user: user._id },
            {
                $set: {
                    resumeFileName: file.name,
                    resumeText: extractedText.slice(0, 20000),
                    headline: parsedData.headline || undefined,
                    location: parsedData.location || undefined,
                    bio: parsedData.summary || undefined,
                    parsedSkills: parsedData.skills || [],
                    experience: parsedData.experience || [],
                    education: parsedData.education || [],
                    githubUrl: parsedData.githubUrl || undefined,
                    portfolioUrl: parsedData.portfolioUrl || undefined,
                    linkedinUrl: parsedData.linkedinUrl || undefined
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Resume parsed and profile updated successfully!',
            data: {
                profile: updatedProfile,
                parsedResume: parsedData
            }
        });
    } catch (error) {
        console.error('POST /api/candidate/resume error:', error);
        return NextResponse.json({ error: 'Failed to process resume file.' }, { status: 500 });
    }
}
