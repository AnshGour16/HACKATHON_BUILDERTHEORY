'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Briefcase, Building2, MapPin, DollarSign, Github, FileText,
    CheckCircle2, ArrowLeft, Loader2, Sparkles, AlertCircle, Target
} from 'lucide-react';

interface IRubricItem {
    name: string;
    weight: number;
    description?: string;
}

interface IJob {
    _id: string;
    title: string;
    companyName: string;
    department: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryRange?: { min?: number; max?: number; currency?: string };
    evaluationType: 'TECHNICAL_GITHUB' | 'NON_TECHNICAL_ASSIGNMENT' | 'RESUME_ONLY';
    requiredSkills: string[];
    description: string;
    responsibilities?: string[];
    requirements?: string[];
    evaluationRubric?: IRubricItem[];
    assignmentBrief?: string;
    status: string;
}

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params?.id as string;

    const [job, setJob] = useState<IJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form inputs
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidatePhone, setCandidatePhone] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [githubRepoUrl, setGithubRepoUrl] = useState('');
    const [assignmentSubmission, setAssignmentSubmission] = useState('');
    const [coverLetter, setCoverLetter] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<{ success: boolean; evaluation?: { matchScore?: number; summary?: string } } | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) return;

        // Fetch job details
        fetch(`/api/jobs/${jobId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.job) {
                    setJob(data.job);
                } else {
                    setError(data.error || 'Job not found');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load job details');
            })
            .finally(() => setLoading(false));

        // Attempt to pre-fill from user session & candidate profile
        fetch('/api/candidate/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.profile) {
                    const p = data.profile;
                    if (p.user?.name) setCandidateName(p.user.name);
                    if (p.user?.email) setCandidateEmail(p.user.email);
                    if (p.user?.phone) setCandidatePhone(p.user.phone);
                    if (p.resumeText) setResumeText(p.resumeText);
                    if (p.githubUrl) setGithubRepoUrl(p.githubUrl);
                }
            })
            .catch(() => {});
    }, [jobId]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    candidateName,
                    candidateEmail,
                    candidatePhone,
                    resumeText,
                    githubRepoUrl: job?.evaluationType === 'TECHNICAL_GITHUB' ? githubRepoUrl : undefined,
                    assignmentSubmission: job?.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? assignmentSubmission : undefined,
                    coverLetter
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setSubmitError(data.error || 'Failed to submit application. Please check your inputs.');
                setIsSubmitting(false);
                return;
            }

            setSubmitSuccess(data);
        } catch (err) {
            console.error(err);
            setSubmitError('A network error occurred while submitting your application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center text-white gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-neutral-400">Loading position details...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen flex justify-center items-center p-4">
                <Card className="max-w-md w-full border-red-500/30 bg-neutral-900/60 text-center p-6 space-y-4">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Job Not Found</h3>
                    <p className="text-xs text-neutral-400">{error || 'This position is no longer accepting applications.'}</p>
                    <Button asChild className="w-full bg-primary text-black font-semibold text-xs">
                        <Link href="/jobs">Browse All Openings</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16 px-4 md:px-8 max-w-6xl mx-auto pt-6">
            <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to All Jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Job Details & Rubric */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Banner */}
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 md:p-8 backdrop-blur-md">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                {job.department}
                            </span>
                            <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                    job.evaluationType === 'TECHNICAL_GITHUB'
                                        ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/20'
                                        : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT'
                                        ? 'border-amber-500/40 text-amber-300 bg-amber-950/20'
                                        : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                                }`}
                            >
                                {job.evaluationType === 'TECHNICAL_GITHUB' && <Github className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' && <FileText className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'RESUME_ONLY' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'TECHNICAL_GITHUB' ? 'GitHub Codebase Audit' : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? 'Practical Case Study Audit' : 'Resume Matching'}
                            </Badge>
                            <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-[10px]">
                                {job.experienceLevel}
                            </Badge>
                        </div>

                        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3">
                            {job.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 border-t border-neutral-800/80 pt-4">
                            <span className="flex items-center gap-1.5 font-medium text-neutral-200">
                                <Building2 className="w-4 h-4 text-primary" /> {job.companyName}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-neutral-500" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-neutral-500" /> {job.jobType}
                            </span>
                            {job.salaryRange?.min && (
                                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                                    <DollarSign className="w-4 h-4" />
                                    {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency || 'USD'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Job Description */}
                    <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-white">About the Position</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </CardContent>
                    </Card>

                    {/* Responsibilities */}
                    {job.responsibilities && job.responsibilities.length > 0 && (
                        <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold text-white">Key Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-xs md:text-sm text-neutral-300">
                                    {job.responsibilities.map((resp, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Requirements & Skills */}
                    <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-white">Required Skills & Capabilities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {job.requiredSkills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-semibold text-primary"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {job.requirements && job.requirements.length > 0 && (
                                <ul className="space-y-2 text-xs md:text-sm text-neutral-300 pt-2 border-t border-neutral-800">
                                    {job.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-neutral-500 mt-1">✓</span>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configurable Evaluation Rubric Preview */}
                    {job.evaluationRubric && job.evaluationRubric.length > 0 && (
                        <Card className="border-indigo-500/20 bg-indigo-950/10 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-400" /> Transparent AI Evaluation Rubric (100 pts)
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-400">
                                    Applications are evaluated by Gemini AI strictly based on these objective criteria:
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {job.evaluationRubric.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs"
                                        >
                                            <span className="font-medium text-neutral-200">{item.name}</span>
                                            <span className="font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                                                {item.weight} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Col: Instant Application Card */}
                <div className="space-y-6">
                    {submitSuccess ? (
                        <Card className="border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md p-6 text-center space-y-4 shadow-xl">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-extrabold text-white">Application Submitted!</h3>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                Gemini AI has analyzed your profile and demonstration evidence against the job rubric.
                            </p>

                            {submitSuccess.evaluation?.matchScore !== undefined && (
                                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                                        Initial AI Match Score
                                    </span>
                                    <div className="text-3xl font-black text-emerald-400">
                                        {submitSuccess.evaluation.matchScore}%
                                    </div>
                                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                                        {submitSuccess.evaluation.summary}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10">
                                    <Link href="/dashboard">View Application in Dashboard</Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSubmitSuccess(null)}
                                    className="w-full text-xs text-neutral-400 hover:text-white"
                                >
                                    Submit Another Application
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-primary/20 bg-neutral-900/60 backdrop-blur-md sticky top-6 shadow-2xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" /> Apply for this Role
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Demonstrate your practical skills to stand out to the recruiting team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleApply} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandidateName" className="text-xs font-semibold text-neutral-300">Your Full Name *</label>
                                        <Input
                                            id="appCandidateName"
                                            required
                                            placeholder="Jane Doe"
                                            value={candidateName}
                                            onChange={(e) => setCandidateName(e.target.value)}
                                            className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandidateEmail" className="text-xs font-semibold text-neutral-300">Email Address *</label>
                                        <Input
                                            id="appCandidateEmail"
                                            type="email"
                                            required
                                            placeholder="jane@example.com"
                                            value={candidateEmail}
                                            onChange={(e) => setCandidateEmail(e.target.value)}
                                            className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandidatePhone" className="text-xs font-semibold text-neutral-300">Phone Number</label>
                                        <Input
                                            id="appCandidatePhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={candidatePhone}
                                            onChange={(e) => setCandidatePhone(e.target.value)}
                                            className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                        />
                                    </div>

                                    {/* Role-Specific Demonstrations */}
                                    {job.evaluationType === 'TECHNICAL_GITHUB' ? (
                                        <div className="space-y-1.5 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                                            <label htmlFor="appGithubRepo" className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                                                <Github className="w-3.5 h-3.5" /> Public GitHub Repository URL *
                                            </label>
                                            <p className="text-[11px] text-neutral-400">
                                                Provide a project or open-source codebase you built that reflects the required stack.
                                            </p>
                                            <Input
                                                id="appGithubRepo"
                                                type="url"
                                                required
                                                placeholder="https://github.com/your-username/project-repo"
                                                value={githubRepoUrl}
                                                onChange={(e) => setGithubRepoUrl(e.target.value)}
                                                className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                            />
                                        </div>
                                    ) : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? (
                                        <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                                            <label htmlFor="appAssignment" className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" /> Practical Assignment Solution *
                                            </label>
                                            {job.assignmentBrief && (
                                                <p className="text-[11px] text-neutral-300 bg-neutral-950 p-2 rounded border border-neutral-800">
                                                    <strong>Case Brief:</strong> {job.assignmentBrief}
                                                </p>
                                            )}
                                            <textarea
                                                id="appAssignment"
                                                rows={4}
                                                required
                                                placeholder="Detail your practical solution, campaign strategy, or analysis framework..."
                                                value={assignmentSubmission}
                                                onChange={(e) => setAssignmentSubmission(e.target.value)}
                                                className="w-full p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    ) : null}

                                    {/* Resume Text / Highlights */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="appResumeText" className="text-xs font-semibold text-neutral-300">Resume & Experience Highlights *</label>
                                            <Link href="/candidate/profile" className="text-[10px] text-primary hover:underline">
                                                Upload PDF Resume
                                            </Link>
                                        </div>
                                        <textarea
                                            id="appResumeText"
                                            rows={3}
                                            required
                                            placeholder="Paste your resume summary, top work experiences, or certifications..."
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            className="w-full p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    {/* Cover Note */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="appCoverLetter" className="text-xs font-semibold text-neutral-300">Notes for the Recruiter</label>
                                        <textarea
                                            id="appCoverLetter"
                                            rows={2}
                                            placeholder="Why are you a great match for this role?"
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            className="w-full p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    {submitError && (
                                        <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-xs text-red-400">
                                            {submitError}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10 shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating with AI...
                                            </>
                                        ) : (
                                            'Submit Application for AI Review'
                                        )}
                                    </Button>

                                    <p className="text-[11px] text-neutral-500 text-center">
                                        Zero code execution is performed. Your submission is evaluated statically against the role&apos;s rubric.
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
