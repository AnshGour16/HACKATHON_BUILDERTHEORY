'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Briefcase, Users, Calendar, Award, Search, Sparkles, Filter,
    CheckCircle2, ArrowRight, MessageSquare, Bot, Send, Loader2,
    ChevronRight, ExternalLink, RefreshCw, PlusCircle, Check, X,
    SlidersHorizontal, LayoutGrid, Columns3, UserCheck, ShieldCheck
} from 'lucide-react';

interface IJobOption {
    _id: string;
    title: string;
    companyName: string;
    department: string;
    candidateCount?: number;
    status: string;
}

interface IApplicationItem {
    _id: string;
    job: {
        _id: string;
        title: string;
        companyName: string;
        department: string;
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
        parsedSkills?: string[];
        experience?: Array<{ role: string; company: string }>;
    };
    status: 'APPLIED' | 'SCREENING' | 'ASSESSMENT' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
    matchScore: number;
    aiEvaluation?: {
        summary?: string;
        strengths?: string[];
        weaknesses?: string[];
    };
    recruiterNotes?: string;
    appliedAt: string;
}

export default function RecruiterDashboard() {
    const [jobs, setJobs] = useState<IJobOption[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
    const [applications, setApplications] = useState<IApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'PIPELINE' | 'MATCHES_GRID'>('PIPELINE');
    const [searchQuery, setSearchQuery] = useState('');

    // Copilot State (Image 1)
    const [showCopilot, setShowCopilot] = useState(true);
    const [copilotQuery, setCopilotQuery] = useState('');
    const [copilotLoading, setCopilotLoading] = useState(false);
    const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
        { sender: 'bot', text: 'Hello! I am your AI Recruiter Copilot. I analyze applicant backgrounds and code evidence. Ask me to compare candidates, suggest who to interview first, or draft interview questions!' }
    ]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                fetch('/api/jobs?recruiterOnly=true'),
                fetch(`/api/applications${selectedJobId !== 'ALL' ? `?jobId=${selectedJobId}` : ''}`)
            ]);

            const jobsData = await jobsRes.json();
            const appsData = await appsRes.json();

            if (jobsData.success) setJobs(jobsData.data || []);
            if (appsData.success) setApplications(appsData.data || []);
        } catch (e) {
            console.error('Failed to load recruiter data:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedJobId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Stage progression handler
    const handleMoveStage = async (appId: string, nextStage: string) => {
        try {
            const res = await fetch(`/api/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStage })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Copilot query submission
    const handleCopilotSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!copilotQuery.trim() || copilotLoading) return;

        const userText = copilotQuery.trim();
        setCopilotMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setCopilotQuery('');
        setCopilotLoading(true);

        try {
            const res = await fetch('/api/recruiter/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userText,
                    jobId: selectedJobId !== 'ALL' ? selectedJobId : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setCopilotMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
            } else {
                setCopilotMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
            }
        } catch {
            setCopilotMessages(prev => [...prev, { sender: 'bot', text: 'Network error communicating with Recruiter Copilot.' }]);
        } finally {
            setCopilotLoading(false);
        }
    };

    // Filtered applications
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = !searchQuery ||
                app.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.candidateProfile?.parsedSkills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch;
        });
    }, [applications, searchQuery]);

    // Top metrics
    const stats = useMemo(() => {
        const activeJobs = jobs.filter(j => j.status === 'OPEN').length;
        const totalPipeline = applications.length;
        const interviewsScheduled = applications.filter(a => a.status === 'INTERVIEW').length;
        const offersPending = applications.filter(a => a.status === 'OFFER' || a.status === 'HIRED').length;
        return { activeJobs, totalPipeline, interviewsScheduled, offersPending };
    }, [jobs, applications]);

    // Pipeline Columns (Image 3)
    const pipelineStages = [
        { key: 'APPLIED', label: 'Application Review', color: 'border-blue-500/40 text-blue-400' },
        { key: 'SCREENING', label: 'Phone Screening', color: 'border-indigo-500/40 text-indigo-400' },
        { key: 'ASSESSMENT', label: 'Practical Assessment', color: 'border-purple-500/40 text-purple-400' },
        { key: 'INTERVIEW', label: 'Face to Face Interview', color: 'border-amber-500/40 text-amber-400' },
        { key: 'OFFER', label: 'Offer & Selected', color: 'border-emerald-500/40 text-emerald-400' }
    ];

    const activeJobTitle = selectedJobId !== 'ALL' ? jobs.find(j => j._id === selectedJobId)?.title : 'All Active Roles';

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Profile & Job Selector */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Recruiter Intelligence Center</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                                Active Hiring Season
                            </Badge>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                            {activeJobTitle}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Job Selector Dropdown */}
                        <select
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            aria-label="Filter candidates by job vacancy"
                            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-white font-medium"
                        >
                            <option value="ALL">All Jobs &amp; Pipelines ({jobs.length})</option>
                            {jobs.map(j => (
                                <option key={j._id} value={j._id}>
                                    {j.title} ({j.department})
                                </option>
                            ))}
                        </select>

                        <Link href="/recruiter/jobs/new">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-9">
                                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Post Job
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Top Metrics Cards (Directly Matching Reference Image 1) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Active Jobs</span>
                                <h3 className="text-2xl font-black text-white">{stats.activeJobs}</h3>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Candidates Pipeline</span>
                                <h3 className="text-2xl font-black text-white">{stats.totalPipeline}</h3>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Interviews Scheduled</span>
                                <h3 className="text-2xl font-black text-white">{stats.interviewsScheduled}</h3>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Offers Pending</span>
                                <h3 className="text-2xl font-black text-white">{stats.offersPending}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter and View Switcher Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder="Search candidate name, job, or skill (e.g. Python, SQL)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-neutral-950/80 border-neutral-700 text-xs text-white h-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                            <button
                                onClick={() => setViewMode('PIPELINE')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${viewMode === 'PIPELINE' ? 'bg-primary text-black font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <Columns3 className="w-3.5 h-3.5" /> Pipeline Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('MATCHES_GRID')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${viewMode === 'MATCHES_GRID' ? 'bg-primary text-black font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" /> AI Candidate Matches
                            </button>
                        </div>

                        <Button onClick={fetchData} variant="outline" size="sm" className="border-neutral-800 text-neutral-300 hover:text-white h-9 w-9 p-0">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* VIEW 1: MULTI-STAGE HIRING KANBAN PIPELINE (IMAGE 3)     */}
                {/* ======================================================== */}
                {viewMode === 'PIPELINE' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[500px]">
                        {pipelineStages.map(stage => {
                            const stageApps = filteredApps.filter(a => {
                                if (stage.key === 'OFFER') return a.status === 'OFFER' || a.status === 'HIRED';
                                return a.status === stage.key;
                            });

                            return (
                                <div key={stage.key} className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3 flex flex-col space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-white">{stage.label}</span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stage.color}`}>
                                                {stageApps.length}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                                        {stageApps.length === 0 ? (
                                            <div className="text-center py-8 text-neutral-600 text-xs italic">
                                                No candidates in this stage
                                            </div>
                                        ) : (
                                            stageApps.map(app => (
                                                <Card key={app._id} className="bg-neutral-950/80 border-neutral-800 hover:border-indigo-500/50 transition-all p-3 space-y-2.5 shadow-md">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div>
                                                            <Link href={`/recruiter/candidate/${app._id}`} className="font-bold text-sm text-white hover:text-primary transition-colors flex items-center gap-1">
                                                                {app.candidate.name}
                                                            </Link>
                                                            <p className="text-[11px] text-neutral-400 truncate max-w-[150px]">
                                                                {app.candidateProfile?.headline || app.job.title}
                                                            </p>
                                                        </div>

                                                        {/* AI Match Score Badge */}
                                                        <Badge className={`text-xs font-black px-2 py-0.5 shrink-0 ${app.matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : app.matchScore >= 75 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-neutral-800 text-neutral-300'}`}>
                                                            {app.matchScore}%
                                                        </Badge>
                                                    </div>

                                                    {/* Skill tags */}
                                                    {app.candidateProfile?.parsedSkills && app.candidateProfile.parsedSkills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {app.candidateProfile.parsedSkills.slice(0, 3).map((s, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Card Actions */}
                                                    <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-xs">
                                                        <Link href={`/recruiter/candidate/${app._id}`} className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5 font-medium">
                                                            Scorecard <ExternalLink className="w-2.5 h-2.5" />
                                                        </Link>

                                                        {/* Advance Stage Dropdown / Button */}
                                                        {stage.key === 'APPLIED' && (
                                                            <button
                                                                onClick={() => handleMoveStage(app._id, 'SCREENING')}
                                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                                                            >
                                                                Screen →
                                                            </button>
                                                        )}
                                                        {stage.key === 'SCREENING' && (
                                                            <button
                                                                onClick={() => handleMoveStage(app._id, 'ASSESSMENT')}
                                                                className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                                                            >
                                                                Assess →
                                                            </button>
                                                        )}
                                                        {stage.key === 'ASSESSMENT' && (
                                                            <button
                                                                onClick={() => handleMoveStage(app._id, 'INTERVIEW')}
                                                                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                                                            >
                                                                Interview →
                                                            </button>
                                                        )}
                                                        {stage.key === 'INTERVIEW' && (
                                                            <button
                                                                onClick={() => handleMoveStage(app._id, 'OFFER')}
                                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                                                            >
                                                                Make Offer →
                                                            </button>
                                                        )}
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ======================================================== */}
                {/* VIEW 2: AI CANDIDATE MATCHES GRID (DIRECTLY MATCHING IMAGE 1) */}
                {/* ======================================================== */}
                {viewMode === 'MATCHES_GRID' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredApps.map(app => (
                            <Card key={app._id} className="bg-neutral-900/50 border-neutral-800 hover:border-primary/40 transition-all p-5 rounded-2xl space-y-4 shadow-xl">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-indigo-600/30 border border-primary/40 flex items-center justify-center font-bold text-white text-base">
                                            {app.candidate.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-white hover:text-primary transition-colors">
                                                <Link href={`/recruiter/candidate/${app._id}`}>
                                                    {app.candidate.name}
                                                </Link>
                                            </h3>
                                            <p className="text-xs text-neutral-400">
                                                {app.candidateProfile?.headline || app.job.title}
                                            </p>
                                        </div>
                                    </div>

                                    <Badge variant="outline" className={`text-[10px] ${app.status === 'APPLIED' ? 'border-blue-500/40 text-blue-300' : app.status === 'INTERVIEW' ? 'border-amber-500/40 text-amber-300' : 'border-emerald-500/40 text-emerald-300'}`}>
                                        {app.status === 'APPLIED' ? 'New' : app.status === 'SCREENING' ? 'Under Review' : app.status === 'INTERVIEW' ? 'Interview' : app.status}
                                    </Badge>
                                </div>

                                {/* Prominent Match Score Display (Image 1) */}
                                <div>
                                    <span className="text-[11px] text-neutral-400 font-medium">Match Score</span>
                                    <div className="text-3xl font-black text-emerald-400 flex items-baseline gap-1 mt-0.5">
                                        {app.matchScore}%
                                    </div>
                                </div>

                                {/* Skill Pills (Python, SQL, Project Management) */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {(app.candidateProfile?.parsedSkills || ['TypeScript', 'React', 'Problem Solving']).slice(0, 4).map((s, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-300">
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {app.aiEvaluation?.summary && (
                                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
                                        {app.aiEvaluation.summary}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                                    <span className="text-[11px] text-neutral-500">
                                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                                    </span>
                                    <Link href={`/recruiter/candidate/${app._id}`}>
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-7 px-3">
                                            Scorecard <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ======================================================== */}
                {/* FLOATING RECRUITER COPILOT ASSISTANT (IMAGE 1)           */}
                {/* ======================================================== */}
                <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
                    {!showCopilot ? (
                        <Button
                            onClick={() => setShowCopilot(true)}
                            className="ml-auto bg-gradient-to-r from-primary to-indigo-600 text-black font-bold shadow-2xl flex items-center gap-2 rounded-full px-4 py-2.5"
                        >
                            <Bot className="w-4 h-4" /> Recruiter Copilot
                        </Button>
                    ) : (
                        <div className="bg-neutral-900 border border-primary/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col h-96">
                            {/* Copilot Header */}
                            <div className="bg-neutral-950 p-3 border-b border-neutral-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-bold text-white">Recruiter Copilot</span>
                                </div>
                                <button
                                    onClick={() => setShowCopilot(false)}
                                    className="text-neutral-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Chat messages */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                                {copilotMessages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`p-2.5 rounded-xl ${m.sender === 'user' ? 'bg-primary text-black font-medium ml-4' : 'bg-neutral-950 border border-neutral-800 text-neutral-300 mr-4'}`}
                                    >
                                        {m.text}
                                    </div>
                                ))}
                                {copilotLoading && (
                                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs p-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Thinking...
                                    </div>
                                )}
                            </div>

                            {/* Preset suggestions */}
                            <div className="px-3 py-1 flex gap-1 overflow-x-auto border-t border-neutral-800 text-[10px]">
                                <button
                                    onClick={() => setCopilotQuery('Who are the top candidates to interview first?')}
                                    className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 hover:text-white whitespace-nowrap border border-neutral-800"
                                >
                                    Top candidates?
                                </button>
                                <button
                                    onClick={() => setCopilotQuery('Draft interview questions for the highest scoring candidate.')}
                                    className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 hover:text-white whitespace-nowrap border border-neutral-800"
                                >
                                    Interview questions?
                                </button>
                            </div>

                            {/* Input form */}
                            <form onSubmit={handleCopilotSend} className="p-2.5 bg-neutral-950 border-t border-neutral-800 flex gap-2">
                                <Input
                                    placeholder="Ask Copilot about candidates..."
                                    value={copilotQuery}
                                    onChange={(e) => setCopilotQuery(e.target.value)}
                                    className="bg-neutral-900 border-neutral-800 text-xs text-white h-8"
                                />
                                <Button type="submit" disabled={copilotLoading} size="sm" className="bg-primary text-black font-bold h-8 px-3">
                                    <Send className="w-3 h-3" />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
