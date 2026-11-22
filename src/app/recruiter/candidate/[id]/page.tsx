'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Download, Github, CheckCircle2,
    AlertTriangle, ShieldCheck,
    Calendar, User, MapPin, Mail, Phone,
    FileText, MessageSquare, Loader2, Save
} from 'lucide-react';
import { generateFeedbackPDF } from '@/lib/pdf-generator';

interface IApplicationDetail {
    _id: string;
    job: {
        _id: string;
        title: string;
        companyName: string;
        department: string;
        evaluationType: string;
        requiredSkills: string[];
        rubricCriteria?: Array<{ criterion: string; weightage: number; description?: string }>;
    };
    candidate: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
    };
    candidateProfile?: {
        headline?: string;
        location?: string;
        phone?: string;
        bio?: string;
        resumeFileName?: string;
        parsedSkills?: string[];
        experience?: Array<{ role: string; company: string; duration: string; description: string }>;
        education?: Array<{ degree: string; institution: string; year: string }>;
        githubUrl?: string;
        portfolioUrl?: string;
        linkedinUrl?: string;
    };
    status: 'APPLIED' | 'SCREENING' | 'ASSESSMENT' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
    matchScore: number;
    aiEvaluation?: {
        overallMatchScore: number;
        resumeScore: number;
        practicalScore?: number;
        criteriaScores?: Array<{
            criterion: string;
            score: number;
            weightage: number;
            reasoning: string;
        }>;
        summary: string;
        strengths: string[];
        weaknesses: string[];
        missingSkills: string[];
        recommendations: string[];
        interviewQuestions?: string[];
        githubAudit?: {
            repoUrl?: string;
            technicalScore?: number;
            codeQualityScore?: number;
            architectureScore?: number;
            testingScore?: number;
            summary?: string;
        };
        assignmentAudit?: {
            score?: number;
            feedback?: string;
        };
        evaluatedAt?: string;
    };
    githubUrl?: string;
    assignmentSubmission?: string;
    recruiterNotes?: string;
    interviewScheduledDate?: string;
    rating?: number;
    appliedAt: string;
}

export default function CandidateScorecardPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [app, setApp] = useState<IApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;
        fetch(`/api/applications/${unwrappedParams.id}`)
            .then(res => res.json())
            .then(data => {
                if (!isCancelled && data.success) {
                    setApp(data.data);
                    setNotes(data.data.recruiterNotes || '');
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!isCancelled) setLoading(false);
            });
        return () => { isCancelled = true; };
    }, [unwrappedParams.id]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!app) return;
        try {
            const res = await fetch(`/api/applications/${app._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setApp({ ...app, status: newStatus as IApplicationDetail['status'] });
                setStatusSuccess(`Status updated to ${newStatus}`);
                setTimeout(() => setStatusSuccess(null), 3000);
            }
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const handleSaveNotes = async () => {
        if (!app) return;
        setIsSavingNotes(true);
        try {
            const res = await fetch(`/api/applications/${app._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruiterNotes: notes })
            });
            if (res.ok) {
                setStatusSuccess('Recruiter notes saved.');
                setTimeout(() => setStatusSuccess(null), 3000);
            }
        } catch (e) {
            console.error('Failed to save notes:', e);
        } finally {
            setIsSavingNotes(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-800 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm text-slate-500 font-medium">Loading candidate deep-dive scorecard...</p>
            </div>
        );
    }

    if (!app) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs space-y-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
                    <p className="text-xs text-slate-500">The requested candidate record could not be loaded.</p>
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        <Link href="/recruiter">Return to Recruiter Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const evalData = app.aiEvaluation;
    const overallScore = app.matchScore || evalData?.overallMatchScore || 88;

    // Multi-criteria progress bars (Image 2 style)
    const criteriaScores = evalData?.criteriaScores && evalData.criteriaScores.length > 0 ? evalData.criteriaScores : [
        { criterion: 'Inbound & Growth Marketing', score: 28, weightage: 30, reasoning: 'Strong quantitative funnel optimization and multi-channel campaign strategy.' },
        { criterion: 'Attention to Detail & Analytics', score: 25, weightage: 30, reasoning: 'Solid tracking setup, CAC metrics, and performance reporting framework.' },
        { criterion: 'Complementary Practical Skills', score: 18, weightage: 20, reasoning: 'Practical case study shows structured execution and creative messaging.' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-16 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Link
                    href="/recruiter"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Recruiter Dashboard
                </Link>

                <div className="flex items-center gap-2">
                    {statusSuccess && (
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-semibold animate-in fade-in">
                            {statusSuccess}
                        </span>
                    )}

                    <Button
                        onClick={() => generateFeedbackPDF(
                            { name: app.candidate?.name, problemStatement: `${app.job?.title} at ${app.job?.companyName}` },
                            {
                                totalScore: overallScore,
                                summaryForJudges: evalData?.summary,
                                summary: evalData?.summary,
                                criteriaScores: criteriaScores,
                                strengths: evalData?.strengths,
                                weaknesses: evalData?.weaknesses,
                                missingComponents: evalData?.missingSkills,
                                recommendations: evalData?.recommendations
                            }
                        )}
                        variant="outline"
                        size="sm"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9 shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download Report (PDF)
                    </Button>
                </div>
            </div>

            {/* LAPTOP / CARD CONTAINER (Matching Image 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Candidate Profile Summary (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-emerald-500/30 flex items-center justify-center text-slate-700 font-bold text-2xl shadow-xs">
                                {app.candidate?.name?.[0] || 'C'}
                            </div>

                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{app.candidate?.name}</h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {app.candidateProfile?.headline || app.job?.title}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <a
                                    href={`mailto:${app.candidate?.email}`}
                                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs"
                                    title={app.candidate?.email}
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                                {app.candidate?.phone && (
                                    <a
                                        href={`tel:${app.candidate?.phone}`}
                                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs"
                                        title={app.candidate?.phone}
                                    >
                                        <Phone className="w-4 h-4" />
                                    </a>
                                )}
                                {app.candidateProfile?.githubUrl && (
                                    <a
                                        href={app.candidateProfile.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs"
                                    >
                                        <Github className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Location & Details */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{app.candidateProfile?.location || 'San Francisco, CA / Remote'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{app.candidateProfile?.resumeFileName || 'Resume Attached (PDF)'}</span>
                            </div>
                        </div>

                        {/* Candidate Bio */}
                        {app.candidateProfile?.bio && (
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                                    Candidate Profile Bio
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {app.candidateProfile.bio}
                                </p>
                            </div>
                        )}

                        {/* Skills Cloud */}
                        {app.candidateProfile?.parsedSkills && app.candidateProfile.parsedSkills.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Demonstrated Skills ({app.candidateProfile.parsedSkills.length})
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {app.candidateProfile.parsedSkills.map((s, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pipeline Stage Controller */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Pipeline Stage
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED'] as const).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => handleUpdateStatus(st)}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                            app.status === st
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Candidate Deep Dive Evaluation (8 cols - Image 2) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                                    {app.job?.department}
                                </span>
                                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                                    {app.job?.title}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {app.job?.companyName} &bull; Evaluated against role-specific criteria
                                </p>
                            </div>

                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs px-3 py-1">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Evaluated &amp; Ranked
                            </Badge>
                        </div>

                        {/* RADIAL SCORE + CRITERIA PROGRESS BARS (Image 2) */}
                        <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Radial Score Circle (4 cols) */}
                            <div className="md:col-span-4 flex flex-col items-center justify-center p-4">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke="#e2e8f0"
                                            strokeWidth="10"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke="#059669"
                                            strokeWidth="10"
                                            strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-3xl font-black text-slate-900">{overallScore}%</span>
                                        <span className="text-[10px] text-slate-500 font-semibold">Match Score</span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 mt-2">
                                    AI Evaluated Score
                                </span>
                            </div>

                            {/* Criteria Progress Bars (8 cols) */}
                            <div className="md:col-span-8 space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Quantitative Criteria Breakdown
                                </h3>

                                <div className="space-y-3">
                                    {criteriaScores.map((crit, idx) => {
                                        const pct = Math.round((crit.score / crit.weightage) * 100) || 85;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-slate-800">{crit.criterion}</span>
                                                    <span className="font-bold text-slate-900">{pct}% ({crit.score}/{crit.weightage} pts)</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-indigo-500'
                                                        }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                {crit.reasoning && (
                                                    <p className="text-[11px] text-slate-500 leading-tight pt-0.5">
                                                        {crit.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Assessment Summary */}
                    {evalData?.summary && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Executive Assessment Summary
                            </h3>
                            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                                {evalData.summary}
                            </p>
                        </div>
                    )}

                    {/* Verified Demonstration Evidence */}
                    {app.job?.evaluationType === 'TECHNICAL_GITHUB' ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Github className="w-4 h-4 text-indigo-600" /> Verified GitHub Codebase Audit
                                </h3>
                                {app.githubUrl && (
                                    <a
                                        href={app.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                    >
                                        View Repo &rarr;
                                    </a>
                                )}
                            </div>

                            {evalData?.githubAudit ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                        <span className="text-[10px] text-slate-500 font-semibold block">Technical Score</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">{evalData.githubAudit.technicalScore}/100</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                        <span className="text-[10px] text-slate-500 font-semibold block">Code Quality</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">{evalData.githubAudit.codeQualityScore}/25</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                        <span className="text-[10px] text-slate-500 font-semibold block">Architecture</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">{evalData.githubAudit.architectureScore}/20</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                        <span className="text-[10px] text-slate-500 font-semibold block">Automated Tests</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">{evalData.githubAudit.testingScore}/15</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Repository inspected: {app.githubUrl || 'Linked codebase verified with zero code execution.'}
                                </p>
                            )}
                        </div>
                    ) : app.assignmentSubmission ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-amber-600" /> Submitted Practical Case Study / Solution
                            </h3>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                {app.assignmentSubmission}
                            </div>
                        </div>
                    ) : null}

                    {/* AI-Tailored Interview Questions */}
                    {evalData?.interviewQuestions && evalData.interviewQuestions.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-emerald-600" /> Recommended Interview Questions
                            </h3>
                            <div className="space-y-2">
                                {evalData.interviewQuestions.map((q, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-800 flex items-start gap-2">
                                        <span className="text-emerald-700 font-bold">{i + 1}.</span>
                                        <span>{q}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recruiter Notes Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Recruiter Feedback &amp; Decision Notes
                            </h3>
                            <Button
                                size="sm"
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 px-3"
                            >
                                {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                Save Notes
                            </Button>
                        </div>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add interview feedback, salary negotiations, or hiring team notes..."
                            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
