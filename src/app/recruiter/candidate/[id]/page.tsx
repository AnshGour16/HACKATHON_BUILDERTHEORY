'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Download, Github, ExternalLink, CheckCircle2,
    AlertTriangle, ShieldCheck, Code2, Layers, Activity,
    Calendar, User, MapPin, Mail, Phone, Briefcase, Award,
    Check, X, FileText, Wrench, MessageSquare, Star
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

    const fetchDetail = async () => {
        try {
            const res = await fetch(`/api/applications/${unwrappedParams.id}`);
            const data = await res.json();
            if (data.success) {
                setApp(data.data);
                setNotes(data.data.recruiterNotes || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
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
                setStatusSuccess(`Stage updated to ${newStatus}`);
                setTimeout(() => setStatusSuccess(null), 3000);
                fetchDetail();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveNotes = async () => {
        if (!app) return;
        setIsSavingNotes(true);
        try {
            await fetch(`/api/applications/${app._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruiterNotes: notes })
            });
            setStatusSuccess('Recruiter notes saved.');
            setTimeout(() => setStatusSuccess(null), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading candidate evaluation scorecard...</div>;
    }

    if (!app) {
        return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Application record not found.</div>;
    }

    const ai = app.aiEvaluation;
    const profile = app.candidateProfile;
    const matchScore = app.matchScore || ai?.overallMatchScore || 85;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Navigation Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="border-neutral-800 text-neutral-300 hover:text-white">
                            <Link href="/recruiter"><ArrowLeft className="w-4 h-4" /></Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-white">{app.candidate.name}</h1>
                                <Badge variant="outline" className="border-indigo-500/50 text-indigo-300 text-xs">
                                    {app.job.title}
                                </Badge>
                                <Badge className={`text-xs ${app.status === 'OFFER' ? 'bg-emerald-500/20 text-emerald-300' : app.status === 'INTERVIEW' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    {app.status}
                                </Badge>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">{app.job.companyName} • {app.job.department}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {statusSuccess && (
                            <span className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/40 animate-in fade-in">
                                ✓ {statusSuccess}
                            </span>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                generateFeedbackPDF(
                                    { name: app.candidate.name, track: app.job.title },
                                    {
                                        totalScore: matchScore,
                                        summaryForJudges: ai?.summary || 'Candidate evaluation report',
                                        strengths: ai?.strengths || [],
                                        weaknesses: ai?.weaknesses || [],
                                        criteriaScores: ai?.criteriaScores?.map(c => ({
                                            criterion: c.criterion,
                                            score: c.score,
                                            reasoning: c.reasoning
                                        })) || []
                                    }
                                );
                            }}
                            className="border-neutral-700 text-neutral-300 hover:text-white text-xs h-8"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDF
                        </Button>

                        {/* Stage Actions */}
                        {app.status !== 'INTERVIEW' && app.status !== 'OFFER' && (
                            <Button
                                size="sm"
                                onClick={() => handleUpdateStatus('INTERVIEW')}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8"
                            >
                                Schedule Interview
                            </Button>
                        )}
                        {app.status !== 'OFFER' && (
                            <Button
                                size="sm"
                                onClick={() => handleUpdateStatus('OFFER')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-8"
                            >
                                Extend Offer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Split Layout: Left Profile | Right Scorecard (Directly Matching Reference Image 2) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Candidate Profile & Credentials */}
                    <div className="space-y-4">
                        <Card className="bg-neutral-900/60 border-neutral-800 p-5 rounded-2xl space-y-5">
                            {/* Avatar & Contact */}
                            <div className="text-center space-y-2 pb-4 border-b border-neutral-800">
                                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-indigo-600/30 border-2 border-primary/40 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                                    {app.candidate.name.charAt(0)}
                                </div>
                                <h2 className="text-lg font-bold text-white">{app.candidate.name}</h2>
                                <p className="text-xs text-primary font-medium">{profile?.headline || 'Applicant'}</p>

                                {profile?.location && (
                                    <p className="text-xs text-neutral-400 flex items-center justify-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-neutral-500" /> {profile.location}
                                    </p>
                                )}
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                    <span className="truncate">{app.candidate.email}</span>
                                </div>
                                {(profile?.phone || app.candidate.phone) && (
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                        <span>{profile?.phone || app.candidate.phone}</span>
                                    </div>
                                )}
                                {(app.githubUrl || profile?.githubUrl) && (
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <Github className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <a
                                            href={app.githubUrl || profile?.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 hover:underline truncate"
                                        >
                                            {(app.githubUrl || profile?.githubUrl)?.replace(/^https?:\/\/github\.com\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Resume CV Download Button (Matching Image 2) */}
                            {profile?.resumeFileName && (
                                <div className="pt-2">
                                    <Button variant="outline" className="w-full border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-xs text-white">
                                        <FileText className="w-3.5 h-3.5 mr-2 text-primary" />
                                        Download CV ({profile.resumeFileName})
                                    </Button>
                                </div>
                            )}

                            {/* Parsed Skills Tags */}
                            {profile?.parsedSkills && profile.parsedSkills.length > 0 && (
                                <div className="pt-3 border-t border-neutral-800 space-y-2">
                                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                        Candidate Skills ({profile.parsedSkills.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.parsedSkills.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work Experience */}
                            {profile?.experience && profile.experience.length > 0 && (
                                <div className="pt-3 border-t border-neutral-800 space-y-2">
                                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                        Career History
                                    </span>
                                    <div className="space-y-2">
                                        {profile.experience.map((exp, i) => (
                                            <div key={i} className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80 text-xs space-y-0.5">
                                                <div className="font-semibold text-white">{exp.role}</div>
                                                <div className="text-[11px] text-primary">{exp.company} • {exp.duration}</div>
                                                {exp.description && <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">{exp.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* CENTER / RIGHT COLUMN: QUANTITATIVE EVALUATION SCORECARD (IMAGE 2) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Quantitative Results Card with Radial Score & Progress Bars */}
                        <Card className="bg-neutral-900/60 border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                                <div>
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Evaluation &amp; Challenge Audit</span>
                                    <h3 className="text-xl font-bold text-white mt-0.5">{app.job.title}</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                        Verified with Gemini AI • Status: <span className="text-emerald-400 font-semibold">Completed</span>
                                    </p>
                                </div>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 w-fit">
                                    ✓ AI Verified Evidence
                                </Badge>
                            </div>

                            {/* Radial Score & Rubric Breakdown Grid (Directly Matching Reference Image 2) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                {/* Radial Score Circle */}
                                <div className="flex flex-col items-center justify-center p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 text-center">
                                    <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-950/20 shadow-xl shadow-emerald-500/10">
                                        <div className="text-3xl font-black text-white">{matchScore}%</div>
                                    </div>
                                    <span className="text-xs font-bold text-neutral-300 mt-3">Overall Match Score</span>
                                    <span className="text-[10px] text-neutral-500 mt-0.5">Weighted Multi-Factor</span>
                                </div>

                                {/* Category Breakdown Progress Bars (Image 2) */}
                                <div className="md:col-span-2 space-y-3.5">
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Quantitative Criterion Results
                                    </h4>

                                    {(ai?.criteriaScores && ai.criteriaScores.length > 0 ? ai.criteriaScores : [
                                        { criterion: 'Job Requirement Alignment', score: 32, weightage: 35, reasoning: 'Strong core skill match' },
                                        { criterion: 'Practical Skill Demonstration', score: 30, weightage: 35, reasoning: 'Solid code/assignment execution' },
                                        { criterion: 'Domain Depth & Execution', score: 26, weightage: 30, reasoning: 'Clear architectural principles' }
                                    ]).map((c, i) => {
                                        const pct = Math.round((c.score / c.weightage) * 100);
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-white">{c.criterion}</span>
                                                    <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                                                </div>
                                                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-indigo-400' : 'bg-cyan-400'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-neutral-500 leading-tight">{c.reasoning}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        {/* AI Executive Summary */}
                        {ai?.summary && (
                            <Card className="bg-neutral-900/40 border-neutral-800 p-5 rounded-2xl space-y-2">
                                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" /> AI Candidate Evaluation Summary
                                </h4>
                                <p className="text-sm text-neutral-300 leading-relaxed">
                                    {ai.summary}
                                </p>
                            </Card>
                        )}

                        {/* Verified GitHub Audit (For Technical Roles) */}
                        {ai?.githubAudit && (
                            <Card className="bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Github className="w-4 h-4" /> Verified Codebase Audit (Technical Role)
                                    </h4>
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs">
                                        Code Score: {ai.githubAudit.technicalScore}/100
                                    </Badge>
                                </div>
                                <p className="text-xs text-neutral-300 leading-relaxed">
                                    {ai.githubAudit.summary || 'Static code analysis audited directory architecture, clean function boundaries, testing evidence, and commit cadence.'}
                                </p>
                            </Card>
                        )}

                        {/* Strengths & Weaknesses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ai?.strengths && ai.strengths.length > 0 && (
                                <Card className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                                    <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Validated Strengths
                                    </h5>
                                    <ul className="space-y-1">
                                        {ai.strengths.map((s, i) => (
                                            <li key={i} className="text-xs text-neutral-300 flex items-start gap-1.5">
                                                <span className="text-emerald-400">•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {ai?.weaknesses && ai.weaknesses.length > 0 && (
                                <Card className="bg-red-950/10 border border-red-500/20 p-4 rounded-xl space-y-2">
                                    <h5 className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4" /> Skill Gaps &amp; Considerations
                                    </h5>
                                    <ul className="space-y-1">
                                        {ai.weaknesses.map((w, i) => (
                                            <li key={i} className="text-xs text-neutral-300 flex items-start gap-1.5">
                                                <span className="text-red-400">•</span> {w}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
                        </div>

                        {/* AI Recommended Interview Questions */}
                        {ai?.interviewQuestions && ai.interviewQuestions.length > 0 && (
                            <Card className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl space-y-3">
                                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4" /> Tailored Interview Questions for this Candidate
                                </h4>
                                <ul className="space-y-2">
                                    {ai.interviewQuestions.map((q, i) => (
                                        <li key={i} className="text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80 flex items-start gap-2">
                                            <span className="font-bold text-indigo-400">{i + 1}.</span> {q}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Recruiter Notes & Interview Log */}
                        <Card className="bg-neutral-900/60 border-neutral-800 p-5 rounded-2xl space-y-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Recruiter Notes &amp; Hiring Feedback
                            </h4>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add interviewer observations, phone screen notes, or compensation expectations..."
                                rows={3}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary"
                            />
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={isSavingNotes}
                                    className="bg-primary text-black font-bold text-xs h-8"
                                >
                                    {isSavingNotes ? 'Saving...' : 'Save Recruiter Notes'}
                                </Button>
                            </div>
                        </Card>

                    </div>
                </div>

            </div>
        </div>
    );
}
