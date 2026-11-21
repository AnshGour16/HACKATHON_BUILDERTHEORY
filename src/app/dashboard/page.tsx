'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Brain, Target, AlertTriangle, CheckCircle2,
    Github, Loader2, Trophy, Users,
    ExternalLink, Code2, GitBranch, ShieldCheck, Activity, Layers,
    Crown, Sparkles, RefreshCw, Wrench, Briefcase, Building2,
    MapPin, ChevronRight, FileText, ArrowRight
} from 'lucide-react';

interface IApplicationItem {
    _id: string;
    job?: {
        _id: string;
        title: string;
        companyName: string;
        department: string;
        location: string;
        jobType: string;
        evaluationType: string;
        status: string;
    };
    status: string;
    matchScore?: number;
    aiEvaluation?: {
        overallMatchScore?: number;
        criteriaScores?: { name: string; score: number; maxScore: number; rationale?: string }[];
        strengths?: string[];
        weaknesses?: string[];
        interviewQuestions?: string[];
        recommendation?: string;
        summary?: string;
    };
    appliedAt: string;
    notes?: { text: string; authorName: string; createdAt: string }[];
}

interface ITeamMember {
    name: string;
    email?: string;
    college?: string;
    department?: string;
    rollNo?: string;
}

interface ITeamData {
    _id: string;
    name: string;
    track: string;
    projectTitle?: string;
    problemStatement: string;
    solutionDescription?: string;
    college?: string;
    leaderPhone?: string;
    members: ITeamMember[];
    githubUrl?: string;
    githubStatus?: 'NOT_SUBMITTED' | 'ANALYZING' | 'EVALUATED' | 'FAILED';
    githubScore?: number;
    finalScore?: number;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    hackathon?: {
        name: string;
        theme: string;
        description: string;
        isCodeSubmissionOpen: boolean;
        codeSubmissionDeadline?: string | Date;
        isFinalResultsPublished?: boolean;
        finalResultsPublishedAt?: string | Date;
        winnerCount?: number;
    };
}

interface IGitHubEvaluationData {
    repoUrl?: string;
    repoOwner?: string;
    repoName?: string;
    defaultBranch?: string;
    primaryLanguage?: string;
    stars?: number;
    forks?: number;
    openIssues?: number;
    submittedAt?: string | Date;
    analyzedAt?: string | Date;
    status: 'NOT_SUBMITTED' | 'ANALYZING' | 'EVALUATED' | 'FAILED';
    technicalScore?: number;
    breakdown?: {
        codeQualityMaintainability?: number;
        codeQuality?: number;
        technicalImplementation?: number;
        architectureProjectStructure?: number;
        architecture?: number;
        testingErrorHandling?: number;
        documentationAndTesting?: number;
        documentationDevPractices?: number;
        developmentActivity?: number;
    };
    architectureAssessment?: string;
    codeQualityAssessment?: string;
    documentationAssessment?: string;
    testingAssessment?: string;
    codeQualityObservations?: string;
    architectureObservations?: string;
    testingObservations?: string;
    securityObservations?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingImplementationEvidence?: string[];
    improvementRecommendations?: string[];
    filesInspected?: string[];
    analysisLimitations?: string[];
    summary?: string;
    error?: string;
}

interface ISubmissionData {
    _id: string;
    status: 'PENDING' | 'AI_PROCESSING' | 'EVALUATED' | 'FAILED';
    finalScore?: number;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    githubEvaluation?: IGitHubEvaluationData;
}

export default function UnifiedDashboard() {
    const [activeTab, setActiveTab] = useState<'CANDIDATE' | 'HACKATHON'>('CANDIDATE');
    const [applications, setApplications] = useState<IApplicationItem[]>([]);
    const [selectedApp, setSelectedApp] = useState<IApplicationItem | null>(null);
    const [team, setTeam] = useState<ITeamData | null>(null);
    const [submission, setSubmission] = useState<ISubmissionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Code Submission & Re-evaluation State
    const [githubUrl, setGithubUrl] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [showEditRepo, setShowEditRepo] = useState(false);
    const [codeSubmitStatus, setCodeSubmitStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

    const fetchAllData = async () => {
        try {
            const [userSubRes, appRes] = await Promise.all([
                fetch('/api/user-submission').catch(() => null),
                fetch('/api/applications').catch(() => null)
            ]);

            if (userSubRes && userSubRes.ok) {
                const subData = await userSubRes.json();
                if (subData.success) {
                    setTeam(subData.team || null);
                    setSubmission(subData.submission || null);
                    if (subData.team?.githubUrl) {
                        setGithubUrl(subData.team.githubUrl);
                    }
                }
            }

            if (appRes && appRes.ok) {
                const appData = await appRes.json();
                if (appData.success && Array.isArray(appData.data)) {
                    setApplications(appData.data);
                    if (appData.data.length > 0) {
                        setSelectedApp(appData.data[0]);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setError('Error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleCodeSubmit = async (e?: React.FormEvent, isRetry = false) => {
        if (e) e.preventDefault();
        const urlToSend = isRetry ? (submission?.githubEvaluation?.repoUrl || team?.githubUrl || githubUrl) : githubUrl;
        if (!team || (!urlToSend && !isRetry)) return;

        setIsSubmittingCode(true);
        setCodeSubmitStatus({ type: 'idle', message: '' });

        try {
            const res = await fetch('/api/submit-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubUrl: urlToSend,
                    retry: isRetry
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setCodeSubmitStatus({ type: 'success', message: 'Successfully analyzed and evaluated repository!' });
                setShowEditRepo(false);
                fetchAllData();
            } else {
                setCodeSubmitStatus({ type: 'error', message: data.error || 'Failed to analyze repository.' });
            }
        } catch {
            setCodeSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsSubmittingCode(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center text-white gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-neutral-400">Loading your candidate intelligence dashboard...</p>
            </div>
        );
    }

    const gh = submission?.githubEvaluation;
    const isEvaluated = gh?.status === 'EVALUATED' || team?.githubStatus === 'EVALUATED';
    const currentScore = gh?.technicalScore ?? team?.githubScore;
    const isCodePhaseOpen = team?.hackathon?.isCodeSubmissionOpen ?? true;

    // Default to Hackathon tab if user has team and 0 job applications
    const effectiveTab = applications.length === 0 && team ? 'HACKATHON' : activeTab;

    return (
        <div className="min-h-screen p-4 md:p-8 relative max-w-7xl mx-auto">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Dashboard Subheader & Mode Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Talent & Project Dashboard</h1>
                    <p className="text-xs text-neutral-400 mt-1">
                        Track your industry applications, AI matching scores, and technical repository reviews.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
                    <button
                        onClick={() => setActiveTab('CANDIDATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            effectiveTab === 'CANDIDATE'
                                ? 'bg-primary text-black'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5" />
                        My Job Applications ({applications.length})
                    </button>
                    {team && (
                        <button
                            onClick={() => setActiveTab('HACKATHON')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                effectiveTab === 'HACKATHON'
                                    ? 'bg-primary text-black'
                                    : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5" />
                            Hackathon Team ({team.name})
                        </button>
                    )}
                </div>
            </div>

            {/* CANDIDATE VIEW: JOB APPLICATIONS & AI INTELLIGENCE */}
            {effectiveTab === 'CANDIDATE' ? (
                <div className="space-y-6">
                    {/* Top Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm p-4">
                            <span className="text-xs text-neutral-400 font-medium block">Total Applications</span>
                            <span className="text-3xl font-black text-white mt-1 block">{applications.length}</span>
                        </Card>
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm p-4">
                            <span className="text-xs text-indigo-400 font-medium block">Under AI Review</span>
                            <span className="text-3xl font-black text-indigo-300 mt-1 block">
                                {applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING').length}
                            </span>
                        </Card>
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm p-4">
                            <span className="text-xs text-amber-400 font-medium block">Interviews Scheduled</span>
                            <span className="text-3xl font-black text-amber-300 mt-1 block">
                                {applications.filter(a => a.status === 'INTERVIEW' || a.status === 'ASSESSMENT').length}
                            </span>
                        </Card>
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm p-4">
                            <span className="text-xs text-emerald-400 font-medium block">Offers Received</span>
                            <span className="text-3xl font-black text-emerald-300 mt-1 block">
                                {applications.filter(a => a.status === 'OFFER' || a.status === 'HIRED').length}
                            </span>
                        </Card>
                    </div>

                    {applications.length === 0 ? (
                        <Card className="border-neutral-800 bg-neutral-900/30 p-12 text-center space-y-4">
                            <Briefcase className="w-12 h-12 text-neutral-600 mx-auto" />
                            <h3 className="text-lg font-bold text-white">No job applications submitted yet</h3>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto">
                                Explore vacancies across Software, Sales, Marketing, Finance, HR, Operations, Support, and Design to demonstrate your skills.
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <Button asChild className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-9">
                                    <Link href="/jobs">
                                        Browse Open Roles <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-neutral-700 text-xs h-9 text-neutral-300">
                                    <Link href="/candidate/profile">
                                        Upload Resume & Build Profile
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Applications List */}
                            <div className="lg:col-span-1 space-y-3">
                                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    Submitted Applications ({applications.length})
                                </h3>

                                <div className="space-y-2.5">
                                    {applications.map(app => (
                                        <div
                                            key={app._id}
                                            onClick={() => setSelectedApp(app)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                                selectedApp?._id === app._id
                                                    ? 'bg-neutral-800/80 border-primary shadow-lg'
                                                    : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-white line-clamp-1">
                                                    {app.job?.title || 'Applied Position'}
                                                </h4>
                                                {app.matchScore !== undefined && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                                        {app.matchScore}%
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-neutral-400 flex items-center gap-1.5 mb-2">
                                                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                                                {app.job?.companyName || 'Hiring Company'}
                                            </p>

                                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] ${
                                                        app.status === 'OFFER' || app.status === 'HIRED'
                                                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                                                            : app.status === 'INTERVIEW'
                                                            ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/20'
                                                            : app.status === 'REJECTED'
                                                            ? 'border-red-500/40 text-red-400 bg-red-950/20'
                                                            : 'border-neutral-700 text-neutral-300'
                                                    }`}
                                                >
                                                    {app.status}
                                                </Badge>
                                                <span className="text-neutral-500">
                                                    {new Date(app.appliedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deep Dive Scorecard Preview */}
                            <div className="lg:col-span-2">
                                {selectedApp ? (
                                    <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur-md p-6 space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                                        {selectedApp.job?.department}
                                                    </span>
                                                    <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-[10px]">
                                                        {selectedApp.job?.location}
                                                    </Badge>
                                                </div>
                                                <h2 className="text-2xl font-extrabold text-white">
                                                    {selectedApp.job?.title}
                                                </h2>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    {selectedApp.job?.companyName} • Applied on {new Date(selectedApp.appliedAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {selectedApp.matchScore !== undefined && (
                                                <div className="flex flex-col items-center bg-emerald-950/30 border border-emerald-500/40 px-5 py-3 rounded-xl shrink-0">
                                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Match Score</span>
                                                    <span className="text-3xl font-black text-white mt-0.5">
                                                        {selectedApp.matchScore}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Roadmap */}
                                        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-neutral-400">Current Pipeline Stage:</span>
                                                <strong className="text-primary uppercase tracking-wider font-bold">
                                                    {selectedApp.status}
                                                </strong>
                                            </div>
                                            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden flex">
                                                <div
                                                    className="bg-primary h-full transition-all duration-500"
                                                    style={{
                                                        width:
                                                            selectedApp.status === 'APPLIED' ? '20%' :
                                                            selectedApp.status === 'SCREENING' ? '40%' :
                                                            selectedApp.status === 'ASSESSMENT' ? '60%' :
                                                            selectedApp.status === 'INTERVIEW' ? '80%' :
                                                            selectedApp.status === 'OFFER' || selectedApp.status === 'HIRED' ? '100%' : '10%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* AI Criteria Breakdown */}
                                        {selectedApp.aiEvaluation?.criteriaScores && selectedApp.aiEvaluation.criteriaScores.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <Target className="w-4 h-4 text-primary" /> Evaluation Criteria Breakdown
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedApp.aiEvaluation.criteriaScores.map((crit, i) => (
                                                        <div key={i} className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-semibold text-white">{crit.name}</span>
                                                                <span className="font-bold text-primary">{crit.score} / {crit.maxScore} pts</span>
                                                            </div>
                                                            {crit.rationale && (
                                                                <p className="text-[11px] text-neutral-400">{crit.rationale}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {selectedApp.aiEvaluation?.summary && (
                                            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-1">
                                                <h4 className="font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                                    <Brain className="w-3.5 h-3.5" /> AI Candidate Assessment
                                                </h4>
                                                <p className="text-neutral-300 leading-relaxed">
                                                    {selectedApp.aiEvaluation.summary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Strengths & Recommendations */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedApp.aiEvaluation?.strengths && selectedApp.aiEvaluation.strengths.length > 0 && (
                                                <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 space-y-2">
                                                    <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                                                    </h5>
                                                    <ul className="space-y-1 text-xs text-neutral-300">
                                                        {selectedApp.aiEvaluation.strengths.map((str, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="text-emerald-400">•</span> {str}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedApp.aiEvaluation?.weaknesses && selectedApp.aiEvaluation.weaknesses.length > 0 && (
                                                <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/20 space-y-2">
                                                    <h5 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5" /> Growth Recommendations
                                                    </h5>
                                                    <ul className="space-y-1 text-xs text-neutral-300">
                                                        {selectedApp.aiEvaluation.weaknesses.map((w, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="text-amber-400">→</span> {w}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-8 bg-neutral-900/30 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                                        Select an application to view detailed AI scorecard.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* HACKATHON VIEW: PRESERVED FULL WORKING IMPLEMENTATION */}
            {effectiveTab === 'HACKATHON' && team ? (
                <div className="space-y-8">
                    {/* Team Header Profile */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 backdrop-blur-md">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                    {team.hackathon?.name || 'Hackathon Project'}
                                </span>
                                <Badge variant="outline" className="border-indigo-500/50 text-indigo-300">
                                    {team.track} Track
                                </Badge>
                                {isEvaluated ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Codebase Evaluated & Ranked
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-primary/30 text-primary">
                                        <Github className="w-3.5 h-3.5 mr-1" /> Awaiting Code Submission
                                    </Badge>
                                )}
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">{team.name}</h2>
                            {team.projectTitle && (
                                <p className="text-primary font-medium text-sm mt-0.5">{team.projectTitle}</p>
                            )}
                            <p className="text-neutral-400 text-sm mt-2 max-w-2xl">{team.problemStatement}</p>
                        </div>

                        {typeof currentScore === 'number' && (
                            <div className="flex flex-col items-center bg-indigo-500/10 border border-indigo-500/30 px-6 py-4 rounded-xl">
                                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Repository Score
                                </span>
                                <span className="text-4xl font-extrabold text-white mt-1">
                                    {currentScore}
                                    <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Repository Evaluation Card */}
                    {isEvaluated && gh && !showEditRepo ? (
                        <Card className="border-indigo-500/30 bg-neutral-900/50 backdrop-blur-md shadow-xl space-y-6 p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold">
                                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Codebase Evaluated & Verified
                                        </Badge>
                                        {gh.primaryLanguage && (
                                            <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-xs">
                                                {gh.primaryLanguage}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Github className="w-5 h-5 text-indigo-400" />
                                        <a
                                            href={gh.repoUrl || team.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-indigo-400 hover:underline flex items-center gap-1.5"
                                        >
                                            {gh.repoOwner ? `${gh.repoOwner}/${gh.repoName}` : (team.githubUrl || 'Linked Repository')}
                                            <ExternalLink className="w-4 h-4 opacity-70" />
                                        </a>
                                    </h3>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowEditRepo(true)}
                                        className="border-neutral-800 text-neutral-400 hover:text-white text-xs"
                                    >
                                        Update Repo
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleCodeSubmit(undefined, true)}
                                        disabled={isSubmittingCode}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                                    >
                                        {isSubmittingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                                        Re-Evaluate
                                    </Button>
                                </div>
                            </div>

                            {/* Rubric Breakdown */}
                            {gh.breakdown && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate">Code Quality</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.codeQualityMaintainability ?? gh.breakdown.codeQuality} / 25
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate">Implementation</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.technicalImplementation} / 25
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate">Architecture</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.architectureProjectStructure ?? gh.breakdown.architecture} / 20
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate">Testing</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.testingErrorHandling ?? gh.breakdown.documentationAndTesting} / 15
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate">Docs & Git</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.documentationDevPractices ?? gh.breakdown.developmentActivity} / 15
                                        </span>
                                    </div>
                                </div>
                            )}

                            {gh.summary && (
                                <div className="bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-xl text-xs text-neutral-300 leading-relaxed">
                                    <strong className="text-indigo-400 block mb-1">Assessment Summary:</strong>
                                    {gh.summary}
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card className="border-indigo-500/40 bg-neutral-900/60 backdrop-blur-md shadow-xl p-6">
                            <form onSubmit={(e) => handleCodeSubmit(e, false)} className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Github className="w-5 h-5 text-primary" /> Submit Public GitHub Repository
                                </h3>
                                <p className="text-xs text-neutral-400">
                                    Submit your repository URL. Gemini AI will evaluate code quality, structure, testing, and git practices against the 100-point rubric.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="url"
                                        required
                                        placeholder="https://github.com/organization/project"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        className="bg-neutral-950 border-neutral-700 flex-1 text-white text-xs h-10"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingCode || !githubUrl.trim()}
                                        className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10 px-5"
                                    >
                                        {isSubmittingCode ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Run AI Code Audit'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            ) : null}
        </div>
    );
}
