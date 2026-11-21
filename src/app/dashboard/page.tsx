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
    Crown, Sparkles, RefreshCw, Wrench
} from 'lucide-react';

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

export default function ParticipantDashboard() {
    const [team, setTeam] = useState<ITeamData | null>(null);
    const [submission, setSubmission] = useState<ISubmissionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Code Submission & Re-evaluation State
    const [githubUrl, setGithubUrl] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [showEditRepo, setShowEditRepo] = useState(false);
    const [codeSubmitStatus, setCodeSubmitStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/user-submission');
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to load dashboard. Please log in.');
                setLoading(false);
                return;
            }

            if (data.success) {
                setTeam(data.team || null);
                setSubmission(data.submission || null);
                if (data.team?.githubUrl) {
                    setGithubUrl(data.team.githubUrl);
                }
            }
        } catch (e) {
            console.error(e);
            setError('Network error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
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
                fetchDashboardData();
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
                <p className="text-sm text-neutral-400">Loading your team repository dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center text-white p-4">
                <Card className="max-w-md w-full border-red-500/30 bg-background/60 backdrop-blur-md text-center p-6 space-y-4">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold">Access Restricted</h3>
                    <p className="text-sm text-neutral-400">{error}</p>
                    <Button asChild className="w-full bg-primary text-black font-semibold">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-neutral-950 flex justify-center items-center p-4">
                <Card className="max-w-md w-full border-primary/20 bg-background/60 backdrop-blur-md text-center p-6 space-y-4">
                    <Trophy className="w-10 h-10 text-primary mx-auto" />
                    <CardTitle className="text-2xl font-bold">No Team Registered</CardTitle>
                    <CardDescription>
                        You are logged in, but you haven&apos;t registered your hackathon team profile yet.
                    </CardDescription>
                    <Button asChild className="w-full bg-primary text-black font-bold">
                        <Link href="/register">Register Team Now</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const gh = submission?.githubEvaluation;
    const isEvaluated = gh?.status === 'EVALUATED' || team.githubStatus === 'EVALUATED';
    const currentScore = gh?.technicalScore ?? team.githubScore;
    const isCodePhaseOpen = team.hackathon?.isCodeSubmissionOpen ?? true;

    return (
        <div className="min-h-screen p-6 md:p-10 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
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
                            {team.hackathon?.isFinalResultsPublished ? (
                                team.isWinner ? (
                                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                        <Crown className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                        {team.winnerPosition === 1 ? '🏆 Grand Champion (1st Place)' : team.winnerPosition === 2 ? '🥈 2nd Place Winner' : team.winnerPosition === 3 ? '🥉 3rd Place Winner' : `🏅 Official Finalist (Rank #${team.finalRank})`}
                                    </Badge>
                                ) : team.finalRank ? (
                                    <Badge className="bg-neutral-800 text-neutral-300 border border-neutral-700">
                                        Official Final Rank #{team.finalRank}
                                    </Badge>
                                ) : null
                            ) : isEvaluated ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Codebase Evaluated & Ranked
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-primary/30 text-primary">
                                    <Github className="w-3.5 h-3.5 mr-1" /> Awaiting Code Submission
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-extrabold text-white">{team.name}</h1>
                        {team.projectTitle && (
                            <p className="text-primary font-medium text-sm mt-0.5">{team.projectTitle}</p>
                        )}
                        <p className="text-neutral-400 text-sm mt-2 max-w-2xl">{team.problemStatement}</p>

                        {team.college && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
                                <span>🏛️ {team.college}</span>
                                {team.leaderPhone && <span>• 📞 {team.leaderPhone}</span>}
                            </div>
                        )}
                    </div>

                    {/* Prominent Score Display */}
                    {team.hackathon?.isFinalResultsPublished && (team.finalScore !== undefined || submission?.finalScore !== undefined) ? (
                        <div className="flex flex-col items-center bg-amber-500/10 border border-amber-500/30 px-6 py-4 rounded-xl">
                            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" /> Official Final Score
                            </span>
                            <span className="text-4xl font-extrabold text-white mt-1">
                                {team.finalScore ?? submission?.finalScore}
                                <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                            </span>
                            {team.finalRank && (
                                <span className="text-xs text-amber-300 font-semibold mt-1">
                                    Leaderboard Rank #{team.finalRank}
                                </span>
                            )}
                        </div>
                    ) : typeof currentScore === 'number' ? (
                        <div className="flex flex-col items-center bg-indigo-500/10 border border-indigo-500/30 px-6 py-4 rounded-xl">
                            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Repository Score
                            </span>
                            <span className="text-4xl font-extrabold text-white mt-1">
                                {currentScore}
                                <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                            </span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">100-Point AI Rubric</span>
                        </div>
                    ) : null}
                </div>

                {/* Final Results & Winner Announcement Banner */}
                {team.hackathon?.isFinalResultsPublished && team.isWinner && (
                    <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-500/50 p-5 rounded-2xl flex items-center gap-4 text-amber-300 text-sm shadow-xl shadow-amber-500/10 animate-in fade-in">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <Crown className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-white text-lg">
                                    🎉 Congratulations! {team.name} is a Hackathon Winner!
                                </h3>
                                <Badge className="bg-amber-500 text-black font-black text-xs px-2 py-0.5">
                                    {team.winnerPosition === 1 ? '🏆 1ST PLACE CHAMPION' : team.winnerPosition === 2 ? '🥈 2ND PLACE WINNER' : team.winnerPosition === 3 ? '🥉 3RD PLACE WINNER' : '🏅 OFFICIAL FINALIST'}
                                </Badge>
                            </div>
                            <p className="text-neutral-300 text-xs">
                                Official Final Rank: <strong className="text-amber-400">#{team.finalRank}</strong> • Repository Score: <strong className="text-white">{team.finalScore ?? submission?.finalScore ?? currentScore} / 100</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Team Members Roster */}
                {team.members && team.members.length > 0 && (
                    <Card className="border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
                        <CardHeader className="py-3 px-5 border-b border-neutral-800/60">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-neutral-300">
                                <Users className="w-4 h-4 text-primary" /> Registered Team Members ({team.members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-wrap gap-2">
                            {team.members.map((m, idx) => (
                                <div key={idx} className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
                                    <span className="font-semibold text-white">{m.name}</span>
                                    {m.college && <span className="text-neutral-400"> ({m.college})</span>}
                                    {m.email && <span className="text-neutral-500 block text-[11px]">{m.email}</span>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* ======================================================== */}
                {/* PRIMARY SECTION: GITHUB CODEBASE EVALUATION & SCORECARD */}
                {/* ======================================================== */}
                {!isCodePhaseOpen && !isEvaluated ? (
                    <Card className="border-amber-500/30 bg-amber-950/10 backdrop-blur-md">
                        <CardHeader className="py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-amber-300 text-lg font-bold">
                                        <Github className="w-5 h-5 text-amber-400" /> Repository Submissions Locked
                                    </CardTitle>
                                    <CardDescription className="text-amber-200/70 text-xs mt-1">
                                        Repository submission for {team.hackathon?.name || 'this hackathon'} is currently locked by the organizers.
                                    </CardDescription>
                                </div>
                                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs py-1 px-3 w-fit">
                                    Portal Locked
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>
                ) : isSubmittingCode || gh?.status === 'ANALYZING' ? (
                    <Card className="border-indigo-500/40 bg-indigo-950/30 backdrop-blur-md animate-pulse">
                        <CardHeader className="text-center py-10">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-3" />
                            <CardTitle className="text-2xl text-white font-bold">
                                AI Codebase Analysis In Progress
                            </CardTitle>
                            <CardDescription className="text-neutral-400 text-sm max-w-md mx-auto mt-2">
                                Gathering repository tree, inspecting dependencies, auditing source code files, and analyzing development activity with Gemini 2.5 Flash...
                            </CardDescription>
                            <div className="flex justify-center mt-4">
                                <Button onClick={fetchDashboardData} variant="outline" size="sm" className="border-neutral-700 text-xs">
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Status
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                ) : isEvaluated && gh && !showEditRepo ? (
                    <Card className="border-indigo-500/30 bg-neutral-900/50 backdrop-blur-md shadow-xl space-y-6 p-6">
                        {/* Header Profile */}
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
                                    {gh.defaultBranch && (
                                        <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                            <GitBranch className="w-3 h-3" /> {gh.defaultBranch}
                                        </span>
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
                                <p className="text-xs text-neutral-500 mt-1">
                                    Analyzed on {gh.analyzedAt ? new Date(gh.analyzedAt).toLocaleString() : 'Recent Audit'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center bg-indigo-950/40 border border-indigo-500/40 px-5 py-3 rounded-xl">
                                    <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">Technical Score</span>
                                    <span className="text-3xl font-extrabold text-white mt-0.5">
                                        {gh.technicalScore ?? 0}
                                        <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEditRepo(true)}
                                    className="border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs"
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

                        {/* 5-Part Rubric Breakdown */}
                        {gh.breakdown && (
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-indigo-400" /> 100-Point Technical Rubric Breakdown
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate" title="Code Quality & Maintainability">Code Quality</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.codeQualityMaintainability ?? gh.breakdown.codeQuality} <span className="text-xs text-neutral-500 font-normal">/ 25</span>
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate" title="Technical Implementation">Implementation</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.technicalImplementation} <span className="text-xs text-neutral-500 font-normal">/ 25</span>
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate" title="Architecture & Project Structure">Architecture</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.architectureProjectStructure ?? gh.breakdown.architecture} <span className="text-xs text-neutral-500 font-normal">/ 20</span>
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate" title="Testing & Error Handling">Testing & Errors</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.testingErrorHandling ?? gh.breakdown.documentationAndTesting} <span className="text-xs text-neutral-500 font-normal">/ 15</span>
                                        </span>
                                    </div>
                                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg text-center">
                                        <span className="text-[11px] text-neutral-400 block truncate" title="Documentation & Development Practices">Docs & Git</span>
                                        <span className="text-lg font-bold text-white mt-0.5 block">
                                            {gh.breakdown.documentationDevPractices ?? gh.breakdown.developmentActivity} <span className="text-xs text-neutral-500 font-normal">/ 15</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Executive Summary */}
                        {gh.summary && (
                            <div className="bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-xl">
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Brain className="w-4 h-4 text-indigo-400" /> Technical Assessment Summary
                                </h4>
                                <p className="text-sm text-neutral-300 leading-relaxed">
                                    {gh.summary}
                                </p>
                            </div>
                        )}

                        {/* Detailed Observations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(gh.architectureObservations || gh.architectureAssessment) && (
                                <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-xl space-y-1">
                                    <h5 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" /> Architecture & Modularity
                                    </h5>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        {gh.architectureObservations || gh.architectureAssessment}
                                    </p>
                                </div>
                            )}

                            {(gh.codeQualityObservations || gh.codeQualityAssessment) && (
                                <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-xl space-y-1">
                                    <h5 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                        <Code2 className="w-3.5 h-3.5" /> Code Quality & Hygiene
                                    </h5>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        {gh.codeQualityObservations || gh.codeQualityAssessment}
                                    </p>
                                </div>
                            )}

                            {(gh.testingObservations || gh.testingAssessment) && (
                                <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-xl space-y-1">
                                    <h5 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" /> Testing & Error Handling
                                    </h5>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        {gh.testingObservations || gh.testingAssessment}
                                    </p>
                                </div>
                            )}

                            {gh.securityObservations && (
                                <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-xl space-y-1">
                                    <h5 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Security & Static Safety
                                    </h5>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        {gh.securityObservations}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gh.strengths && gh.strengths.length > 0 && (
                                <div className="border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl space-y-2">
                                    <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Technical Strengths
                                    </h5>
                                    <ul className="space-y-1.5">
                                        {gh.strengths.map((str, i) => (
                                            <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                                <span className="text-emerald-400">•</span> {str}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {gh.weaknesses && gh.weaknesses.length > 0 && (
                                <div className="border border-red-500/20 bg-red-950/10 p-4 rounded-xl space-y-2">
                                    <h5 className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4" /> Technical Weaknesses & Gaps
                                    </h5>
                                    <ul className="space-y-1.5">
                                        {gh.weaknesses.map((w, i) => (
                                            <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                                <span className="text-red-400">•</span> {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Improvement Recommendations */}
                        {gh.improvementRecommendations && gh.improvementRecommendations.length > 0 && (
                            <div className="border border-indigo-500/20 bg-indigo-950/10 p-4 rounded-xl space-y-2">
                                <h5 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-indigo-400" /> Actionable Recommendations for Judges
                                </h5>
                                <ul className="space-y-1">
                                    {gh.improvementRecommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                            <span className="text-indigo-400">→</span> {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Transparent Files Inspected */}
                        {gh.filesInspected && gh.filesInspected.length > 0 && (
                            <div className="bg-neutral-950/60 border border-neutral-800 p-3 rounded-xl text-xs space-y-1">
                                <span className="text-[11px] font-semibold text-neutral-400 block">
                                    Files Analyzed ({gh.filesInspected.length})
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {gh.filesInspected.map((file, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                                            {file}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="border-indigo-500/40 bg-neutral-900/60 backdrop-blur-md shadow-xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-white text-xl">
                                    <Github className="w-6 h-6 text-primary" /> Submit Public GitHub Repository
                                </CardTitle>
                                {gh?.status === 'FAILED' && (
                                    <Badge variant="destructive" className="bg-red-900/40 text-red-200 border-red-800">
                                        Previous Evaluation Failed
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-neutral-400 text-xs mt-1">
                                Submit your team&apos;s public GitHub repository. Gemini AI will inspect repository architecture, dependencies, actual source files, test suites, and commit cadence against our 100-point technical rubric.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {gh?.status === 'FAILED' && gh.error && (
                                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                                    <span>Error: {gh.error}</span>
                                </div>
                            )}

                            <form onSubmit={(e) => handleCodeSubmit(e, false)} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="repoInput" className="text-xs font-semibold text-neutral-300">
                                        Public GitHub Repository URL
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            id="repoInput"
                                            type="url"
                                            required
                                            placeholder="https://github.com/organization/project"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            className="bg-neutral-950 border-neutral-700 flex-1 text-white text-sm h-11"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSubmittingCode || !githubUrl.trim()}
                                            className="bg-primary hover:bg-primary/90 text-black font-bold text-sm h-11 px-6 shrink-0 shadow-lg shadow-primary/20"
                                        >
                                            {isSubmittingCode ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Auditing Codebase...</>
                                            ) : (
                                                'Submit Code for AI Audit'
                                            )}
                                        </Button>
                                        {showEditRepo && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setShowEditRepo(false)}
                                                className="text-neutral-400 hover:text-white h-11"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
                                    <p className="font-semibold text-white flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> What will the AI inspect?
                                    </p>
                                    <p className="leading-relaxed">
                                        README setup instructions, dependency manifests (e.g. <code>package.json</code>, <code>requirements.txt</code>), source code structure, error handling, test files, and genuine commit activity. Zero code execution is performed.
                                    </p>
                                </div>
                            </form>

                            {codeSubmitStatus.message && (
                                <p className={`text-xs ${codeSubmitStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {codeSubmitStatus.message}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
