'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Brain, Target, CheckCircle2,
    Github, Loader2, Trophy,
    ExternalLink, ShieldCheck,
    Crown, Sparkles, RefreshCw, Briefcase, Building2,
    ArrowRight, AlertTriangle
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
            console.error('Error loading dashboard:', e);
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
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-800 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs text-slate-500 font-medium">Loading your candidate intelligence dashboard...</p>
            </div>
        );
    }

    const gh = submission?.githubEvaluation;
    const isEvaluated = gh?.status === 'EVALUATED' || team?.githubStatus === 'EVALUATED';
    const currentScore = gh?.technicalScore ?? team?.githubScore;

    // Default to Hackathon tab if user has team and 0 job applications
    const effectiveTab = applications.length === 0 && team ? 'HACKATHON' : activeTab;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 max-w-7xl mx-auto text-slate-800">
            {/* Dashboard Subheader & Mode Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Talent &amp; Career Dashboard
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Track your industry applications, AI matching scores, and technical repository reviews.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                        onClick={() => setActiveTab('CANDIDATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            effectiveTab === 'CANDIDATE'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5" />
                        Job Applications ({applications.length})
                    </button>
                    {team && (
                        <button
                            onClick={() => setActiveTab('HACKATHON')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                effectiveTab === 'HACKATHON'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
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
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-xs text-slate-500 font-medium block">Total Applications</span>
                            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{applications.length}</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-xs text-blue-600 font-medium block">Under AI Review</span>
                            <span className="text-3xl font-extrabold text-blue-700 mt-1 block">
                                {applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING').length}
                            </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-xs text-amber-600 font-medium block">Interviews Scheduled</span>
                            <span className="text-3xl font-extrabold text-amber-700 mt-1 block">
                                {applications.filter(a => a.status === 'INTERVIEW' || a.status === 'ASSESSMENT').length}
                            </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-xs text-emerald-600 font-medium block">Offers Received</span>
                            <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
                                {applications.filter(a => a.status === 'OFFER' || a.status === 'HIRED').length}
                            </span>
                        </div>
                    </div>

                    {applications.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-bold text-slate-900">No job applications submitted yet</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                Explore vacancies across Software, Sales, Marketing, Finance, HR, Operations, Support, and Design to demonstrate your skills.
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs">
                                    <Link href="/jobs">
                                        Browse Open Roles <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-slate-300 text-xs h-9 text-slate-700">
                                    <Link href="/candidate/profile">
                                        Upload Resume &amp; Build Profile
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Applications List */}
                            <div className="lg:col-span-1 space-y-3">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Submitted Applications ({applications.length})
                                </h3>

                                <div className="space-y-2.5">
                                    {applications.map(app => (
                                        <div
                                            key={app._id}
                                            onClick={() => setSelectedApp(app)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                                selectedApp?._id === app._id
                                                    ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                                    {app.job?.title || 'Applied Position'}
                                                </h4>
                                                {app.matchScore !== undefined && (
                                                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {app.matchScore}%
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2 font-medium">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                {app.job?.companyName || 'Hiring Company'}
                                            </p>

                                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold ${
                                                        app.status === 'OFFER' || app.status === 'HIRED'
                                                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                                            : app.status === 'INTERVIEW'
                                                            ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                                            : app.status === 'REJECTED'
                                                            ? 'border-red-300 text-red-700 bg-red-50'
                                                            : 'border-slate-200 text-slate-700 bg-slate-50'
                                                    }`}
                                                >
                                                    {app.status}
                                                </Badge>
                                                <span className="text-slate-400 font-medium">
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
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                                        {selectedApp.job?.department}
                                                    </span>
                                                    <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px]">
                                                        {selectedApp.job?.location}
                                                    </Badge>
                                                </div>
                                                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                                                    {selectedApp.job?.title}
                                                </h2>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {selectedApp.job?.companyName} &bull; Applied on {new Date(selectedApp.appliedAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {selectedApp.matchScore !== undefined && (
                                                <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl shrink-0">
                                                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">AI Match Score</span>
                                                    <span className="text-3xl font-black text-emerald-700 mt-0.5">
                                                        {selectedApp.matchScore}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Roadmap */}
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">Current Pipeline Stage:</span>
                                                <strong className="text-slate-900 uppercase tracking-wider font-extrabold">
                                                    {selectedApp.status}
                                                </strong>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                                                <div
                                                    className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                                                    style={{
                                                        width:
                                                            selectedApp.status === 'APPLIED' ? '20%' :
                                                            selectedApp.status === 'SCREENING' ? '40%' :
                                                            selectedApp.status === 'ASSESSMENT' ? '60%' :
                                                            selectedApp.status === 'INTERVIEW' ? '80%' :
                                                            selectedApp.status === 'OFFER' || selectedApp.status === 'HIRED' ? '100%' : '15%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* AI Criteria Breakdown */}
                                        {selectedApp.aiEvaluation?.criteriaScores && selectedApp.aiEvaluation.criteriaScores.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                    <Target className="w-4 h-4 text-emerald-600" /> Evaluation Criteria Breakdown
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedApp.aiEvaluation.criteriaScores.map((crit, i) => (
                                                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-semibold text-slate-800">{crit.name}</span>
                                                                <span className="font-bold text-emerald-700">{crit.score} / {crit.maxScore} pts</span>
                                                            </div>
                                                            {crit.rationale && (
                                                                <p className="text-[11px] text-slate-500 leading-tight">{crit.rationale}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {selectedApp.aiEvaluation?.summary && (
                                            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                                                <h4 className="font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                                                    <Brain className="w-3.5 h-3.5 text-indigo-600" /> AI Candidate Assessment
                                                </h4>
                                                <p className="text-slate-700 leading-relaxed">
                                                    {selectedApp.aiEvaluation.summary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Strengths & Recommendations */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedApp.aiEvaluation?.strengths && selectedApp.aiEvaluation.strengths.length > 0 && (
                                                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                                                    <h5 className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                                                    </h5>
                                                    <ul className="space-y-1 text-xs text-slate-700">
                                                        {selectedApp.aiEvaluation.strengths.map((str, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="text-emerald-600 font-bold">•</span> {str}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedApp.aiEvaluation?.weaknesses && selectedApp.aiEvaluation.weaknesses.length > 0 && (
                                                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                                                    <h5 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Growth Recommendations
                                                    </h5>
                                                    <ul className="space-y-1 text-xs text-slate-700">
                                                        {selectedApp.aiEvaluation.weaknesses.map((w, i) => (
                                                            <li key={i} className="flex items-start gap-1.5">
                                                                <span className="text-amber-600 font-bold">&rarr;</span> {w}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                                        Select an application to view detailed AI scorecard.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* HACKATHON VIEW: PRESERVED FULL WORKING IMPLEMENTATION IN CLASSIC LIGHT THEME */}
            {effectiveTab === 'HACKATHON' && team ? (
                <div className="space-y-6">
                    {/* Team Header Profile */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                    {team.hackathon?.name || 'Hackathon Project'}
                                </span>
                                <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-[10px] font-semibold">
                                    {team.track} Track
                                </Badge>
                                {isEvaluated ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-semibold">
                                        <ShieldCheck className="w-3 h-3 mr-1" /> Codebase Evaluated &amp; Ranked
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px]">
                                        <Github className="w-3 h-3 mr-1" /> Awaiting Code Submission
                                    </Badge>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">{team.name}</h2>
                            {team.projectTitle && (
                                <p className="text-emerald-700 font-semibold text-xs mt-0.5">{team.projectTitle}</p>
                            )}
                            <p className="text-slate-600 text-xs mt-2 max-w-2xl leading-relaxed">{team.problemStatement}</p>
                        </div>

                        {typeof currentScore === 'number' && (
                            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 px-6 py-4 rounded-xl shrink-0">
                                <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Repository Score
                                </span>
                                <span className="text-4xl font-black text-slate-900 mt-1">
                                    {currentScore}
                                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Repository Evaluation Card */}
                    {isEvaluated && gh && !showEditRepo ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold">
                                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Codebase Evaluated &amp; Verified
                                        </Badge>
                                        {gh.primaryLanguage && (
                                            <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs">
                                                {gh.primaryLanguage}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Github className="w-5 h-5 text-indigo-600" />
                                        <a
                                            href={gh.repoUrl || team.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                                        >
                                            {gh.repoOwner ? `${gh.repoOwner}/${gh.repoName}` : (team.githubUrl || 'Linked Repository')}
                                            <ExternalLink className="w-4 h-4 opacity-70" />
                                        </a>
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowEditRepo(true)}
                                        className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-8"
                                    >
                                        Update Repo
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleCodeSubmit(undefined, true)}
                                        disabled={isSubmittingCode}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                                    >
                                        {isSubmittingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                                        Re-Evaluate
                                    </Button>
                                </div>
                            </div>

                            {/* Rubric Breakdown */}
                            {gh.breakdown && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">Code Quality</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                                            {gh.breakdown.codeQualityMaintainability ?? gh.breakdown.codeQuality} / 25
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">Implementation</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                                            {gh.breakdown.technicalImplementation} / 25
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">Architecture</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                                            {gh.breakdown.architectureProjectStructure ?? gh.breakdown.architecture} / 20
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">Testing</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                                            {gh.breakdown.testingErrorHandling ?? gh.breakdown.documentationAndTesting} / 15
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                                        <span className="text-[11px] text-slate-500 font-semibold block truncate">Docs &amp; Git</span>
                                        <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                                            {gh.breakdown.documentationDevPractices ?? gh.breakdown.developmentActivity} / 15
                                        </span>
                                    </div>
                                </div>
                            )}

                            {gh.summary && (
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-700 leading-relaxed">
                                    <strong className="text-slate-900 block mb-1">Assessment Summary:</strong>
                                    {gh.summary}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                            <form onSubmit={(e) => handleCodeSubmit(e, false)} className="space-y-4">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Github className="w-5 h-5 text-indigo-600" /> Submit Public GitHub Repository
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Submit your repository URL. Gemini AI will evaluate code quality, structure, testing, and git practices against the 100-point rubric.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="url"
                                        required
                                        placeholder="https://github.com/organization/project"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        className="bg-slate-50 border-slate-200 flex-1 text-slate-900 text-xs h-10 focus:bg-white"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingCode || !githubUrl.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 shadow-xs"
                                    >
                                        {isSubmittingCode ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Run AI Code Audit'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
