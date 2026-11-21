import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Job from '@/models/Job';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs
 * Discovers jobs with filters for department, jobType, experienceLevel, or recruiter.
 */
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const department = searchParams.get('department');
        const jobType = searchParams.get('jobType');
        const search = searchParams.get('search');
        const recruiterOnly = searchParams.get('recruiterOnly');

        const query: Record<string, unknown> = {};

        if (recruiterOnly === 'true') {
            const session = await getServerSession(authOptions);
            if (!session?.user?.email) {
                return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
            }
            const user = await User.findOne({ email: session.user.email });
            if (user) {
                // If admin, can see all jobs or filter by recruiter
                if (user.role === 'ADMIN') {
                    // admin sees all
                } else {
                    query.recruiter = user._id;
                }
            }
        } else {
            // For public discovery, show only OPEN jobs
            query.status = { $ne: 'CLOSED' };
        }

        if (department && department !== 'ALL') {
            query.department = department;
        }

        if (jobType && jobType !== 'ALL') {
            query.jobType = jobType;
        }

        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { companyName: { $regex: search.trim(), $options: 'i' } },
                { requiredSkills: { $in: [new RegExp(search.trim(), 'i')] } }
            ];
        }

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .populate('recruiter', 'name email companyName')
            .lean();

        // If no jobs exist in DB yet, auto-seed realistic sample jobs across industries
        if (jobs.length === 0 && recruiterOnly !== 'true') {
            let defaultRecruiter = await User.findOne({ role: { $in: ['ADMIN', 'RECRUITER'] } });
            if (!defaultRecruiter) {
                defaultRecruiter = await User.findOne({});
            }

            if (defaultRecruiter) {
                const sampleJobs = [
                    {
                        title: 'Senior Software Engineer (Full-Stack)',
                        companyName: 'CloudScale Technologies',
                        department: 'Software & IT',
                        location: 'San Francisco, CA (Remote)',
                        jobType: 'Full-time',
                        experienceLevel: 'Senior',
                        salaryRange: '$140k - $180k',
                        description: 'We are looking for an experienced Senior Full-Stack Engineer to lead the architecture of our cloud microservices and responsive web platforms. You will design scalable APIs, lead code reviews, and ship modern React/Node.js systems.',
                        requiredSkills: ['TypeScript', 'React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
                        evaluationType: 'TECHNICAL_GITHUB',
                        rubricCriteria: [
                            { criterion: 'Code Quality & Maintainability', weightage: 30, description: 'Type safety, modular architecture, and code cleanliness.' },
                            { criterion: 'System Architecture & Modularity', weightage: 25, description: 'Separation of concerns, API design, and DB schema modeling.' },
                            { criterion: 'Testing & Error Handling', weightage: 25, description: 'Automated test coverage, edge case handling, and resiliency.' },
                            { criterion: 'Git Workflow & Practices', weightage: 20, description: 'Incremental commit history, meaningful commit messages.' }
                        ],
                        recruiter: defaultRecruiter._id,
                        status: 'OPEN',
                        candidateCount: 12
                    },
                    {
                        title: 'Enterprise Growth & Sales Lead',
                        companyName: 'Apex Enterprise Software',
                        department: 'Sales & Business Development',
                        location: 'New York, NY (Hybrid)',
                        jobType: 'Full-time',
                        experienceLevel: 'Senior',
                        salaryRange: '$120k - $160k + Commission',
                        description: 'Drive high-ticket B2B SaaS deals, lead discovery calls, build pipeline, and negotiate multi-year enterprise contracts. Ideal for candidates with proven quotas in technical B2B software sales.',
                        requiredSkills: ['B2B Sales', 'Enterprise Discovery', 'CRM / Salesforce', 'Contract Negotiation', 'Pipeline Management'],
                        evaluationType: 'NON_TECHNICAL_ASSIGNMENT',
                        assignmentPrompt: 'Provide a 1-page executive summary detailing your approach to handling enterprise client objections during a renewal or competitive software pitch.',
                        rubricCriteria: [
                            { criterion: 'Value Proposition & Clarity', weightage: 35, description: 'Ability to articulate business ROI and value proposition.' },
                            { criterion: 'Objection Handling Strategy', weightage: 35, description: 'Structured, persuasive handling of client budget/security concerns.' },
                            { criterion: 'Communication & Executive Presence', weightage: 30, description: 'Professionalism, conciseness, and stakeholder alignment.' }
                        ],
                        recruiter: defaultRecruiter._id,
                        status: 'OPEN',
                        candidateCount: 8
                    },
                    {
                        title: 'Product Marketing Manager',
                        companyName: 'Nova FinTech',
                        department: 'Marketing & Digital Media',
                        location: 'Austin, TX (Remote)',
                        jobType: 'Full-time',
                        experienceLevel: 'Mid-level',
                        salaryRange: '$95k - $125k',
                        description: 'Own our product launch strategies, customer personas, GTM campaigns, and content messaging. Translate technical banking features into compelling benefits for users.',
                        requiredSkills: ['GTM Strategy', 'Product Messaging', 'Campaign Analytics', 'Content Marketing', 'SEO / Performance'],
                        evaluationType: 'NON_TECHNICAL_ASSIGNMENT',
                        assignmentPrompt: 'Submit a brief 3-step GTM campaign concept for launching an AI expense-tracking tool to SMBs.',
                        rubricCriteria: [
                            { criterion: 'Market Persona Alignment', weightage: 40, description: 'Understanding target audience pain points and positioning.' },
                            { criterion: 'Channel Strategy & Distribution', weightage: 35, description: 'Realistic multi-channel execution (Email, Ads, Content).' },
                            { criterion: 'Measurement & KPI Framework', weightage: 25, description: 'Clarity of conversion metrics and ROI tracking.' }
                        ],
                        recruiter: defaultRecruiter._id,
                        status: 'OPEN',
                        candidateCount: 6
                    },
                    {
                        title: 'Financial Analyst & Modeling Specialist',
                        companyName: 'Vanguard Capital Partners',
                        department: 'Finance & Accounting',
                        location: 'Chicago, IL (Hybrid)',
                        jobType: 'Full-time',
                        experienceLevel: 'Mid-level',
                        salaryRange: '$90k - $115k',
                        description: 'Perform financial modeling, forecasting, variance analysis, and monthly executive financial reporting for our portfolio companies.',
                        requiredSkills: ['Financial Modeling', 'Excel / Spreadsheets', 'DCF Valuation', 'Budgeting & Forecasting', 'GAAP'],
                        evaluationType: 'NON_TECHNICAL_ASSIGNMENT',
                        assignmentPrompt: 'Describe the key assumptions and sensitivity analyses you incorporate when modeling SaaS gross margin projections.',
                        rubricCriteria: [
                            { criterion: 'Analytical Rigor & Logic', weightage: 40, description: 'Sound mathematical assumptions and sensitivity testing.' },
                            { criterion: 'Accounting Standard Accuracy', weightage: 30, description: 'Proper recognition rules and GAAP awareness.' },
                            { criterion: 'Executive Insight Presentation', weightage: 30, description: 'Translating model outputs into actionable financial decisions.' }
                        ],
                        recruiter: defaultRecruiter._id,
                        status: 'OPEN',
                        candidateCount: 5
                    }
                ];

                const created = await Job.insertMany(sampleJobs);
                return NextResponse.json({ success: true, count: created.length, data: created });
            }
        }

        return NextResponse.json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        console.error('GET /api/jobs error:', error);
        return NextResponse.json({ error: 'Failed to fetch jobs.' }, { status: 500 });
    }
}

/**
 * POST /api/jobs
 * Recruiter creates a new job vacancy.
 */
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
            title,
            companyName,
            department,
            location,
            jobType,
            experienceLevel,
            salaryRange,
            description,
            requiredSkills,
            niceToHaveSkills,
            evaluationType,
            assignmentPrompt,
            rubricCriteria
        } = body;

        if (!title || !description || !requiredSkills || requiredSkills.length === 0) {
            return NextResponse.json({
                error: 'Job title, description, and at least one required skill are mandatory.'
            }, { status: 400 });
        }

        const job = await Job.create({
            title: title.trim(),
            companyName: companyName ? companyName.trim() : (user.companyName || 'Company'),
            department: department || 'Software & IT',
            location: location || 'Remote',
            jobType: jobType || 'Full-time',
            experienceLevel: experienceLevel || 'Mid-level',
            salaryRange,
            description: description.trim(),
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
            niceToHaveSkills: Array.isArray(niceToHaveSkills) ? niceToHaveSkills : [],
            evaluationType: evaluationType || (department === 'Software & IT' ? 'TECHNICAL_GITHUB' : 'NON_TECHNICAL_ASSIGNMENT'),
            assignmentPrompt,
            rubricCriteria: Array.isArray(rubricCriteria) && rubricCriteria.length > 0 ? rubricCriteria : [
                { criterion: 'Job Requirement Alignment', weightage: 40, description: 'Match with required skills and responsibilities.' },
                { criterion: 'Practical Skill Competence', weightage: 35, description: 'Demonstrated code or case study quality.' },
                { criterion: 'Domain Depth & Execution', weightage: 25, description: 'Professional rigor and problem-solving depth.' }
            ],
            recruiter: user._id,
            status: 'OPEN'
        });

        return NextResponse.json({
            success: true,
            message: 'Job vacancy created successfully.',
            data: job
        }, { status: 201 });
    } catch (error) {
        console.error('POST /api/jobs error:', error);
        return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
    }
}
