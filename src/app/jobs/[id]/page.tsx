'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

        // Pre-fill from candidate profile if logged in
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
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-800 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs text-slate-500 font-medium">Loading position details...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl text-center p-8 space-y-4 shadow-xs">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-slate-900">Job Not Found</h3>
                    <p className="text-xs text-slate-500">{error || 'This position is no longer accepting applications.'}</p>
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        <Link href="/jobs">Browse Open Positions</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16 px-4 md:px-8 max-w-6xl mx-auto pt-6 text-slate-800">
            <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to All Jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Job Details & Rubric */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Banner */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                {job.department}
                            </span>
                            <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${
                                    job.evaluationType === 'TECHNICAL_GITHUB'
                                        ? 'border-indigo-200 text-indigo-700 bg-indigo-50'
                                        : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT'
                                        ? 'border-amber-200 text-amber-700 bg-amber-50'
                                        : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                }`}
                            >
                                {job.evaluationType === 'TECHNICAL_GITHUB' && <Github className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' && <FileText className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'RESUME_ONLY' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                {job.evaluationType === 'TECHNICAL_GITHUB' ? 'GitHub Codebase Audit' : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? 'Practical Case Study Audit' : 'Resume Matching'}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px] font-semibold">
                                {job.experienceLevel}
                            </Badge>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                            {job.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Building2 className="w-4 h-4 text-emerald-600" /> {job.companyName}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-slate-400" /> {job.jobType}
                            </span>
                            {job.salaryRange?.min && (
                                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                                    <DollarSign className="w-4 h-4" />
                                    {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency || 'USD'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Job Description */}
                    <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-900">About the Role</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </CardContent>
                    </Card>

                    {/* Responsibilities */}
                    {job.responsibilities && job.responsibilities.length > 0 && (
                        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold text-slate-900">Key Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-xs md:text-sm text-slate-700">
                                    {job.responsibilities.map((resp, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Requirements & Skills */}
                    <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-900">Required Skills &amp; Qualifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {job.requiredSkills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {job.requirements && job.requirements.length > 0 && (
                                <ul className="space-y-2 text-xs md:text-sm text-slate-700 pt-2 border-t border-slate-100">
                                    {job.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-slate-400 font-bold">✓</span>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transparent Evaluation Rubric Preview */}
                    {job.evaluationRubric && job.evaluationRubric.length > 0 && (
                        <Card className="border-indigo-100 bg-indigo-50/50 shadow-xs rounded-2xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-600" /> Transparent AI Evaluation Rubric (100 Points)
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-600">
                                    Gemini AI evaluates applicants against these exact objective criteria:
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {job.evaluationRubric.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 text-xs"
                                        >
                                            <span className="font-semibold text-slate-800">{item.name}</span>
                                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
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
                        <Card className="border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-4 shadow-md rounded-2xl">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900">Application Submitted!</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Gemini AI has analyzed your profile and demonstration evidence against the job rubric.
                            </p>

                            {submitSuccess.evaluation?.matchScore !== undefined && (
                                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-1">
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                        Initial AI Match Score
                                    </span>
                                    <div className="text-3xl font-black text-emerald-600">
                                        {submitSuccess.evaluation.matchScore}%
                                    </div>
                                    <p className="text-[11px] text-slate-600 line-clamp-2">
                                        {submitSuccess.evaluation.summary}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-xs">
                                    <Link href="/dashboard">View Application in Dashboard</Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSubmitSuccess(null)}
                                    className="w-full text-xs text-slate-600 hover:text-slate-900"
                                >
                                    Submit Another Application
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-white border-slate-200 shadow-sm sticky top-20 rounded-2xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-600" /> Apply for this Position
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Demonstrate your practical skills to stand out to the recruiting team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleApply} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandName" className="text-xs font-semibold text-slate-700">Full Name *</label>
                                        <Input
                                            id="appCandName"
                                            required
                                            placeholder="Jane Doe"
                                            value={candidateName}
                                            onChange={(e) => setCandidateName(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandEmail" className="text-xs font-semibold text-slate-700">Email Address *</label>
                                        <Input
                                            id="appCandEmail"
                                            type="email"
                                            required
                                            placeholder="jane@example.com"
                                            value={candidateEmail}
                                            onChange={(e) => setCandidateEmail(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandPhone" className="text-xs font-semibold text-slate-700">Phone Number</label>
                                        <Input
                                            id="appCandPhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={candidatePhone}
                                            onChange={(e) => setCandidatePhone(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                        />
                                    </div>

                                    {/* Role-Specific Demonstrations */}
                                    {job.evaluationType === 'TECHNICAL_GITHUB' ? (
                                        <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                                            <label htmlFor="appCandGithub" className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                                <Github className="w-3.5 h-3.5" /> Public GitHub Repository URL *
                                            </label>
                                            <p className="text-[11px] text-slate-600">
                                                Provide a project repository you built that showcases your technical architecture and code hygiene.
                                            </p>
                                            <Input
                                                id="appCandGithub"
                                                type="url"
                                                required
                                                placeholder="https://github.com/your-username/project-repo"
                                                value={githubRepoUrl}
                                                onChange={(e) => setGithubRepoUrl(e.target.value)}
                                                className="bg-white border-indigo-200 text-xs h-9 text-slate-900"
                                            />
                                        </div>
                                    ) : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? (
                                        <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                                            <label htmlFor="appCandAssign" className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" /> Practical Assignment Solution *
                                            </label>
                                            {job.assignmentBrief && (
                                                <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-amber-200 font-medium">
                                                    <strong>Case Brief:</strong> {job.assignmentBrief}
                                                </p>
                                            )}
                                            <textarea
                                                id="appCandAssign"
                                                rows={4}
                                                required
                                                placeholder="Detail your practical solution, campaign strategy, or analysis framework..."
                                                value={assignmentSubmission}
                                                onChange={(e) => setAssignmentSubmission(e.target.value)}
                                                className="w-full p-2.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                                            />
                                        </div>
                                    ) : null}

                                    {/* Resume Text / Highlights */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="appCandResume" className="text-xs font-semibold text-slate-700">Resume &amp; Career Summary *</label>
                                            <Link href="/candidate/profile" className="text-[10px] text-emerald-600 font-bold hover:underline">
                                                Upload PDF Resume
                                            </Link>
                                        </div>
                                        <textarea
                                            id="appCandResume"
                                            rows={3}
                                            required
                                            placeholder="Paste your career summary, top achievements, or certifications..."
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Cover Note */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="appCandCover" className="text-xs font-semibold text-slate-700">Notes for the Hiring Team</label>
                                        <textarea
                                            id="appCandCover"
                                            rows={2}
                                            placeholder="Why are you a great match for this role?"
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    {submitError && (
                                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                                            {submitError}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating with AI...
                                            </>
                                        ) : (
                                            'Submit Application for AI Review'
                                        )}
                                    </Button>

                                    <p className="text-[11px] text-slate-500 text-center font-medium">
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
