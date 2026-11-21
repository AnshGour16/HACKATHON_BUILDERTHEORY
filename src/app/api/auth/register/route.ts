import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import CandidateProfile from '@/models/CandidateProfile';
import Team from '@/models/Team';
import Hackathon from '@/models/Hackathon';
import { getOrCreateDefaultHackathon } from '@/lib/hackathon-service';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const {
            name,
            email,
            password,
            role,
            accountType,
            companyName,
            title,
            phone,
            location,
            headline,
            // Legacy team registration fields
            teamName,
            leaderName,
            leaderPhone,
            college,
            hackathonId,
            track,
            projectTitle,
            problemStatement,
            solutionDescription,
            members
        } = body;

        const normalizedEmail = email?.trim()?.toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
            return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
        }
        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
        });

        if (existingUser) {
            return NextResponse.json({
                error: 'An account with this email already exists. Please log in.'
            }, { status: 409 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Case A: Recruiter or Candidate direct registration
        const targetRole = role || (accountType === 'RECRUITER' ? 'RECRUITER' : accountType === 'CANDIDATE' ? 'CANDIDATE' : teamName ? 'PARTICIPANT' : 'CANDIDATE');

        if (targetRole === 'RECRUITER') {
            const recruiterName = name || leaderName || 'Hiring Manager';
            const user = await User.create({
                name: recruiterName,
                email: normalizedEmail,
                passwordHash,
                role: 'RECRUITER',
                companyName: companyName || 'Company',
                title: title || 'Talent Acquisition',
                phone: phone || leaderPhone
            });

            return NextResponse.json({
                success: true,
                message: 'Recruiter account registered successfully.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    companyName: user.companyName
                }
            }, { status: 201 });
        }

        if (targetRole === 'CANDIDATE' && !teamName) {
            const candidateName = name || leaderName || 'Candidate';
            const user = await User.create({
                name: candidateName,
                email: normalizedEmail,
                passwordHash,
                role: 'CANDIDATE',
                phone: phone || leaderPhone
            });

            // Create initial CandidateProfile
            await CandidateProfile.create({
                user: user._id,
                headline: headline || 'Professional Candidate',
                location: location || '',
                phone: phone || leaderPhone || '',
                parsedSkills: [],
                experience: [],
                education: []
            });

            return NextResponse.json({
                success: true,
                message: 'Candidate account registered successfully.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }, { status: 201 });
        }

        // Case B: Legacy Team Registration (Hackathon flow preserved)
        if (!teamName || !teamName.trim()) {
            return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
        }

        const candidateName = leaderName || name || 'Team Leader';
        let hackathon = null;
        if (hackathonId && hackathonId !== 'ALL') {
            hackathon = await Hackathon.findById(hackathonId);
        }
        if (!hackathon) {
            hackathon = await getOrCreateDefaultHackathon();
        }

        const existingTeam = await Team.findOne({
            hackathon: hackathon._id,
            name: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') }
        });

        if (existingTeam) {
            return NextResponse.json({
                error: `A team named "${teamName}" is already registered. Please choose a unique name.`
            }, { status: 409 });
        }

        const user = await User.create({
            name: candidateName,
            email: normalizedEmail,
            passwordHash,
            role: 'PARTICIPANT',
            phone: leaderPhone || phone,
            college: college || ''
        });

        const newTeam = await Team.create({
            name: teamName.trim(),
            hackathon: hackathon._id,
            track: track || 'General',
            projectTitle: projectTitle ? projectTitle.trim() : undefined,
            problemStatement: problemStatement ? problemStatement.trim() : 'Project submission',
            solutionDescription: solutionDescription ? solutionDescription.trim() : undefined,
            leader: user._id,
            leaderPhone: leaderPhone || phone,
            college: college || '',
            members: Array.isArray(members) ? members : []
        });

        return NextResponse.json({
            success: true,
            message: 'Team registered successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            team: {
                id: newTeam._id,
                name: newTeam.name,
                track: newTeam.track
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({
            error: 'Internal server error while creating account. Please try again.'
        }, { status: 500 });
    }
}
