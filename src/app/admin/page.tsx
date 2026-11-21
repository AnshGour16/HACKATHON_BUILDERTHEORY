'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ExternalLink, RefreshCw, Download, Search, Trophy, Users,
    BarChart2, AlertTriangle, Sparkles, Filter, CheckCircle2, Sliders, ChevronDown, ChevronUp,
    Github, Loader2, Eye, X
} from 'lucide-react';
import Link from 'next/link';

import { ISubmission } from '@/models/Submission';
import { ITeam } from '@/models/Team';

interface ISubmissionWithTeam extends Omit<ISubmission, 'team' | 'hackathon'> {
    team: ITeam;
    hackathon?: {
        _id: string;
        name: string;
        theme: string;
        shortlistingStatus?: string;
        shortlistLimit?: number;
        shortlistingMode?: string;
        shortlistedAt?: string;
        shortlistCount?: number;
    };
}

interface IHackathonBrief {
    _id: string;
    name: string;
    slug: string;
    theme: string;
    isCodeSubmissionOpen: boolean;
    blindJudgingEnabled: boolean;
    shortlistingStatus?: string;
    shortlistLimit?: number;
    shortlistingMode?: string;
    shortlistedAt?: string;
    shortlistCount?: number;
}

interface IQualifyingPreviewTeam {
    rank: number;
    teamId: string;
    teamName: string;
    track: string;
    projectTitle?: string;
    score: number;
}

interface IShortlistPreviewResult {
    totalEligible: number;
    qualifyingCount: number;
    cutoffScore: number;
    qualifyingTeams: IQualifyingPreviewTeam[];
}

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<ISubmissionWithTeam[]>([]);
    const [hackathons, setHackathons] = useState<IHackathonBrief[]>([]);
    const [selectedHackathonId, setSelectedHackathonId] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [isCodeSubmissionOpen, setIsCodeSubmissionOpen] = useState(false);
    const [blindJudgingEnabled, setBlindJudgingEnabled] = useState(false);
    const [updatingPhase, setUpdatingPhase] = useState(false);

    // Interactive Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrack, setSelectedTrack] = useState('ALL');
    const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'NEWEST'>('SCORE_DESC');
    const [shortlistStatusFilter, setShortlistStatusFilter] = useState<'ALL' | 'SHORTLISTED' | 'NOT_SHORTLISTED'>('ALL');

    // Organizer Shortlisting Controls State
    const [showShortlistPanel, setShowShortlistPanel] = useState(true);
    const [shortlistMode, setShortlistMode] = useState<'OVERALL' | 'THEME_WISE'>('OVERALL');
    const [shortlistLimit, setShortlistLimit] = useState<number>(25);
    const [themeQuotas, setThemeQuotas] = useState<Record<string, number>>({});
    const [previewData, setPreviewData] = useState<IShortlistPreviewResult | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isApplyingShortlist, setIsApplyingShortlist] = useState(false);
    const [shortlistNotification, setShortlistNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Round 2 Management State
    const [showRound2Panel, setShowRound2Panel] = useState(true);
    const [selectedCodeReport, setSelectedCodeReport] = useState<ISubmissionWithTeam | null>(null);
    const [retryingTeamId, setRetryingTeamId] = useState<string | null>(null);
    const [round2Notification, setRound2Notification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchHackathons = async () => {
        try {
            const res = await fetch('/api/hackathons');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setHackathons(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch hackathons:', error);
        }
    };

    const fetchSettings = useCallback(async (hId: string = selectedHackathonId) => {
        try {
            const url = hId !== 'ALL' ? `/api/settings?hackathonId=${hId}` : '/api/settings';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setIsCodeSubmissionOpen(Boolean(data.isCodeSubmissionOpen));
                setBlindJudgingEnabled(Boolean(data.blindJudgingEnabled));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    }, [selectedHackathonId]);

    const fetchSubmissions = useCallback(async (hId: string = selectedHackathonId) => {
        setLoading(true);
        try {
            const url = hId !== 'ALL' ? `/api/submissions?hackathonId=${hId}` : '/api/submissions';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedHackathonId]);

    useEffect(() => {
        fetchHackathons();
        fetchSubmissions('ALL');
        fetchSettings('ALL');
    }, [fetchSubmissions, fetchSettings]);

    const handleHackathonChange = (hId: string) => {
        setSelectedHackathonId(hId);
        setSelectedTrack('ALL');
        setPreviewData(null);
        setShortlistNotification(null);
        fetchSubmissions(hId);
        fetchSettings(hId);
    };

    const togglePhase = async () => {
        setUpdatingPhase(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hackathonId: selectedHackathonId !== 'ALL' ? selectedHackathonId : undefined,
                    isCodeSubmissionOpen: !isCodeSubmissionOpen
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCodeSubmissionOpen(Boolean(data.isCodeSubmissionOpen));
            }
        } catch (error) {
            console.error('Failed to toggle phase:', error);
        } finally {
            setUpdatingPhase(false);
        }
    };

    // Extract unique tracks
    const uniqueTracks = useMemo(() => {
        const tracks = new Set<string>();
        submissions.forEach((s) => {
            if (s.team?.track) tracks.add(s.team.track);
        });
        return Array.from(tracks);
    }, [submissions]);

    // Current active hackathon object
    const activeHackathon = useMemo(() => {
        if (selectedHackathonId !== 'ALL') {
            return hackathons.find(h => h._id === selectedHackathonId) || null;
        }
        return hackathons.length > 0 ? hackathons[0] : null;
    }, [hackathons, selectedHackathonId]);

    // Computed Analytics
    const stats = useMemo(() => {
        const total = submissions.length;
        if (total === 0) return {
            total: 0, highest: 0, topTeam: 'N/A', average: 0, plagiarismCount: 0, persistentShortlistedCount: 0,
            round2ShortlistedCount: 0, round2SubmittedCount: 0, round2PendingCount: 0, round2EvaluatedCount: 0, round2FailedCount: 0
        };

        let highest = 0;
        let topTeam = 'N/A';
        let totalScoreSum = 0;
        let evaluatedCount = 0;
        let plagiarismCount = 0;
        let persistentShortlistedCount = 0;
        let round2ShortlistedCount = 0;
        let round2SubmittedCount = 0;
        let round2EvaluatedCount = 0;
        let round2FailedCount = 0;

        submissions.forEach((sub) => {
            const score = sub.aiEvaluation?.totalScore || 0;
            if (score > highest) {
                highest = score;
                topTeam = sub.team?.name || 'Unknown';
            }
            if (sub.aiEvaluation?.totalScore !== undefined) {
                totalScoreSum += score;
                evaluatedCount++;
            }
            if (sub.aiEvaluation?.plagiarismFlag) {
                plagiarismCount++;
            }
            if (sub.team?.isShortlisted) {
                persistentShortlistedCount++;
                round2ShortlistedCount++;
                if (sub.githubEvaluation?.repoUrl || sub.team?.githubUrl) {
                    round2SubmittedCount++;
                }
            }
            if (sub.githubEvaluation?.status === 'EVALUATED') {
                round2EvaluatedCount++;
            } else if (sub.githubEvaluation?.status === 'FAILED') {
                round2FailedCount++;
            }
        });

        const average = evaluatedCount > 0 ? Math.round(totalScoreSum / evaluatedCount) : 0;
        const round2PendingCount = Math.max(0, round2ShortlistedCount - round2SubmittedCount);

        return {
            total,
            highest,
            topTeam,
            average,
            plagiarismCount,
            persistentShortlistedCount,
            round2ShortlistedCount,
            round2SubmittedCount,
            round2PendingCount,
            round2EvaluatedCount,
            round2FailedCount
        };
    }, [submissions]);

    // Filtered & Sorted Submissions
    const filteredSubmissions = useMemo(() => {
        return submissions
            .filter((sub) => {
                const matchesSearch =
                    !searchQuery ||
                    sub.team?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sub.team?.problemStatement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sub.team?.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesTrack =
                    selectedTrack === 'ALL' || (sub.team?.track || 'General').toLowerCase() === selectedTrack.toLowerCase();

                const matchesShortlistFilter =
                    shortlistStatusFilter === 'ALL' ||
                    (shortlistStatusFilter === 'SHORTLISTED' && sub.team?.isShortlisted) ||
                    (shortlistStatusFilter === 'NOT_SHORTLISTED' && !sub.team?.isShortlisted);

                return matchesSearch && matchesTrack && matchesShortlistFilter;
            })
            .sort((a, b) => {
                const scoreA = a.aiEvaluation?.totalScore ?? -1;
                const scoreB = b.aiEvaluation?.totalScore ?? -1;

                if (sortBy === 'SCORE_DESC') return scoreB - scoreA;
                if (sortBy === 'SCORE_ASC') return scoreA - scoreB;
                if (sortBy === 'NEWEST') {
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                }
                return 0;
            });
    }, [submissions, searchQuery, selectedTrack, shortlistStatusFilter, sortBy]);

    // ==========================================
    // BACKEND SHORTLISTING ACTIONS
    // ==========================================

    const handlePreviewShortlist = async () => {
        if (!activeHackathon) {
            setShortlistNotification({ type: 'error', message: 'Please select a specific hackathon to configure shortlisting.' });
            return;
        }

        setIsPreviewing(true);
        setShortlistNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/shortlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preview: true,
                    mode: shortlistMode,
                    limit: shortlistLimit,
                    themeLimits: themeQuotas
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setPreviewData({
                    totalEligible: data.totalEligible,
                    qualifyingCount: data.qualifyingCount,
                    cutoffScore: data.cutoffScore,
                    qualifyingTeams: data.qualifyingTeams
                });
            } else {
                setShortlistNotification({ type: 'error', message: data.error || 'Failed to preview shortlisting.' });
            }
        } catch {
            setShortlistNotification({ type: 'error', message: 'Network error generating shortlist preview.' });
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleApplyShortlist = async () => {
        if (!activeHackathon) {
            setShortlistNotification({ type: 'error', message: 'Please select a specific hackathon to confirm shortlisting.' });
            return;
        }

        setIsApplyingShortlist(true);
        setShortlistNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/shortlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preview: false,
                    mode: shortlistMode,
                    limit: shortlistLimit,
                    themeLimits: themeQuotas
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setShortlistNotification({
                    type: 'success',
                    message: `Successfully shortlisted ${data.qualifyingCount} teams for Round 2! Results are permanently saved in MongoDB.`
                });
                setPreviewData(null);
                fetchSubmissions(selectedHackathonId);
                fetchHackathons();
            } else {
                setShortlistNotification({ type: 'error', message: data.error || 'Failed to persist shortlisting.' });
            }
        } catch {
            setShortlistNotification({ type: 'error', message: 'Network error while persisting shortlist.' });
        } finally {
            setIsApplyingShortlist(false);
        }
    };

    const handleRetryCodeAnalysis = async (teamId: string) => {
        setRetryingTeamId(teamId);
        setRound2Notification(null);
        try {
            const res = await fetch('/api/submit-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, retry: true })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRound2Notification({ type: 'success', message: 'Codebase re-evaluated successfully!' });
                fetchSubmissions(selectedHackathonId);
            } else {
                setRound2Notification({ type: 'error', message: data.error || 'Failed to retry code evaluation.' });
            }
        } catch {
            setRound2Notification({ type: 'error', message: 'Network error retrying code analysis.' });
        } finally {
            setRetryingTeamId(null);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-10 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            Live Hackathon Control Center
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Hackathon Leaderboard</h1>
                        <p className="text-neutral-400 text-sm mt-1">Real-time AI-screened submissions with ranked scores & actionable feedback.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Hackathon Filter Dropdown */}
                        <div className="flex items-center gap-2 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800">
                            <Trophy className="w-4 h-4 text-primary ml-1 shrink-0" />
                            <select
                                value={selectedHackathonId}
                                onChange={(e) => handleHackathonChange(e.target.value)}
                                className="h-8 px-2 text-xs bg-neutral-950 border border-neutral-700 rounded-md text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px] truncate"
                            >
                                <option value="ALL">All Hackathons</option>
                                {hackathons.map((h) => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3 bg-neutral-900/60 p-2.5 px-4 rounded-xl border border-neutral-800 backdrop-blur-sm">
                            <div className="text-left">
                                <div className="text-xs font-medium text-white">Phase 2 Code Submission</div>
                                <div className={`text-[11px] font-semibold ${isCodeSubmissionOpen ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                    {isCodeSubmissionOpen ? '● Portal Unlocked' : '○ Locked'}
                                </div>
                            </div>
                            <button
                                onClick={togglePhase}
                                disabled={updatingPhase}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-primary ${isCodeSubmissionOpen ? 'bg-primary' : 'bg-neutral-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCodeSubmissionOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="text-primary border-primary/40 bg-primary/10 hover:bg-primary/20">
                                <Link href="/admin/hackathons">
                                    <Trophy className="h-4 w-4 mr-1.5" /> Event Settings & Themes
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="text-neutral-300 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800">
                                <a
                                    href={`/api/export?${shortlistStatusFilter === 'SHORTLISTED' ? 'shortlistedOnly=true&' : ''}${selectedHackathonId !== 'ALL' ? `hackathonId=${selectedHackathonId}&` : ''}${selectedTrack !== 'ALL' ? `track=${selectedTrack}` : ''}`}
                                    download={shortlistStatusFilter === 'SHORTLISTED' ? 'shortlisted_teams.csv' : 'hackathon_leaderboard.csv'}
                                >
                                    <Download className="h-4 w-4 mr-1.5" />
                                    {shortlistStatusFilter === 'SHORTLISTED' ? 'Export Shortlisted CSV' : 'Export CSV'}
                                </a>
                            </Button>
                            <Button onClick={() => fetchSubmissions(selectedHackathonId)} variant="outline" size="sm" className="text-neutral-300 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Total Teams</span>
                                <h3 className="text-xl font-bold text-white">{stats.total}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Persisted Qualifiers</span>
                                <h3 className="text-xl font-bold text-white">
                                    {stats.persistentShortlistedCount} <span className="text-xs font-normal text-emerald-400">Shortlisted</span>
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Average Score</span>
                                <h3 className="text-xl font-bold text-white">{stats.average}/100</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-neutral-400 font-medium">Plagiarism Alerts</span>
                                <h3 className="text-xl font-bold text-white">{stats.plagiarismCount}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- ORGANIZER SHORTLISTING CONTROL CENTER --- */}
                <Card className="border-emerald-500/30 bg-neutral-950/70 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader className="py-4 border-b border-neutral-800/60 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowShortlistPanel(!showShortlistPanel)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                    Round 2 Automatic Shortlisting Engine
                                    {activeHackathon?.shortlistingStatus === 'SHORTLISTED' && (
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold">
                                            ● Shortlist Saved in MongoDB ({activeHackathon.shortlistCount} Teams)
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-400">
                                    Automatically sort eligible evaluated presentations, select Top N or theme-wise quotas, and persist qualification status directly into MongoDB.
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-neutral-400">
                            {showShortlistPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </CardHeader>

                    {showShortlistPanel && (
                        <CardContent className="p-6 space-y-6">
                            {/* Notification Banner */}
                            {shortlistNotification && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${shortlistNotification.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
                                    {shortlistNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
                                    <span>{shortlistNotification.message}</span>
                                </div>
                            )}

                            {/* Mode Selection Tabs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Shortlisting Mode</label>
                                    <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => { setShortlistMode('OVERALL'); setPreviewData(null); }}
                                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${shortlistMode === 'OVERALL' ? 'bg-primary text-black font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            <Trophy className="w-3.5 h-3.5" /> Overall Ranking
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShortlistMode('THEME_WISE'); setPreviewData(null); }}
                                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${shortlistMode === 'THEME_WISE' ? 'bg-primary text-black font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
                                        >
                                            <Sliders className="w-3.5 h-3.5" /> Theme-Wise Quotas
                                        </button>
                                    </div>
                                </div>

                                {shortlistMode === 'OVERALL' ? (
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Target Team Count</label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {[10, 25, 30].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => { setShortlistLimit(n); setPreviewData(null); }}
                                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${shortlistLimit === n ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'}`}
                                                >
                                                    Top {n}
                                                </button>
                                            ))}
                                            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                                                <span className="text-xs text-neutral-400">Custom N:</span>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={500}
                                                    value={shortlistLimit}
                                                    onChange={(e) => { setShortlistLimit(Math.max(1, parseInt(e.target.value, 10) || 1)); setPreviewData(null); }}
                                                    className="w-16 h-7 text-xs bg-neutral-950 border-neutral-700 text-white font-bold text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Per-Theme Quotas</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                            {uniqueTracks.map((t, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                                                    <span className="truncate max-w-[120px] font-medium text-neutral-300">{t}</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        placeholder="5"
                                                        value={themeQuotas[t] !== undefined ? themeQuotas[t] : 5}
                                                        onChange={(e) => {
                                                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                            setThemeQuotas(prev => ({ ...prev, [t]: val }));
                                                            setPreviewData(null);
                                                        }}
                                                        className="w-14 h-6 text-xs bg-neutral-950 border-neutral-700 text-white text-center font-bold"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Shortlist Action Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/60">
                                <div className="text-xs text-neutral-400">
                                    Event in Scope: <span className="text-white font-semibold">{activeHackathon ? activeHackathon.name : 'All Events'}</span>
                                    {activeHackathon?.shortlistedAt && (
                                        <span className="text-emerald-400 ml-2">
                                            (Last shortlisted on {new Date(activeHackathon.shortlistedAt).toLocaleString()})
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPreviewing || isApplyingShortlist}
                                        onClick={handlePreviewShortlist}
                                        className="border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white text-xs"
                                    >
                                        {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <EyeIcon className="w-3.5 h-3.5 mr-1.5" />}
                                        Preview Qualifying Teams
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isApplyingShortlist}
                                        onClick={handleApplyShortlist}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-lg shadow-emerald-500/20"
                                    >
                                        {isApplyingShortlist ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trophy className="w-3.5 h-3.5 mr-1.5" />}
                                        Confirm & Persist to Database
                                    </Button>
                                </div>
                            </div>

                            {/* Shortlist Preview Drawer */}
                            {previewData && (
                                <div className="p-4 rounded-xl bg-neutral-900/90 border border-emerald-500/40 space-y-4 animate-in fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                                                Preview: Top {previewData.qualifyingCount} Teams
                                            </Badge>
                                            <span className="text-xs text-neutral-400">
                                                Total Evaluated Candidates: <strong className="text-white">{previewData.totalEligible}</strong>
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                                Cutoff Score: <strong className="text-emerald-400">{previewData.cutoffScore}/100</strong>
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleApplyShortlist}
                                            disabled={isApplyingShortlist}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-7"
                                        >
                                            {isApplyingShortlist ? 'Saving to Database...' : 'Save this Shortlist in MongoDB'}
                                        </Button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-xs">
                                        {previewData.qualifyingTeams.map((qt) => (
                                            <div key={qt.teamId} className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px]">
                                                        {qt.rank}
                                                    </span>
                                                    <span className="font-semibold text-white">{qt.teamName}</span>
                                                    <Badge variant="outline" className="text-[10px] py-0 border-indigo-500/40 text-indigo-400">
                                                        {qt.track}
                                                    </Badge>
                                                </div>
                                                <span className="font-extrabold text-emerald-400 text-sm">{qt.score}/100</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* --- ROUND 2 CODEBASE EVALUATION MANAGEMENT CENTER --- */}
                <Card className="border-indigo-500/30 bg-neutral-950/70 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader
                        className="py-4 border-b border-neutral-800/60 flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setShowRound2Panel(!showRound2Panel)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                                <Github className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                    Round 2 Codebase Evaluation Center
                                    <Badge className={isCodeSubmissionOpen ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px]" : "bg-neutral-800 text-neutral-400 border-neutral-700 text-[10px]"}>
                                        {isCodeSubmissionOpen ? "● Code Portal Unlocked" : "○ Code Portal Locked"}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-400">
                                    Monitor GitHub submissions from shortlisted teams, review automated AI technical audits, and retry failed evaluations.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePhase();
                                }}
                                disabled={updatingPhase}
                                className={`text-xs h-7 border ${isCodeSubmissionOpen ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/30' : 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/30'}`}
                            >
                                {updatingPhase ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                {isCodeSubmissionOpen ? 'Lock Round 2' : 'Unlock Round 2'}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-neutral-400">
                                {showRound2Panel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardHeader>

                    {showRound2Panel && (
                        <CardContent className="p-6 space-y-6">
                            {/* Notification */}
                            {round2Notification && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${round2Notification.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
                                    {round2Notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
                                    <span>{round2Notification.message}</span>
                                </div>
                            )}

                            {/* Round 2 Statistics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
                                    <span className="text-[11px] text-neutral-400 font-medium block">Eligible Shortlisted</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xl font-bold text-white">{stats.round2ShortlistedCount}</span>
                                        <span className="text-[10px] text-emerald-400">Teams</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
                                    <span className="text-[11px] text-neutral-400 font-medium block">Repos Submitted</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xl font-bold text-indigo-400">{stats.round2SubmittedCount}</span>
                                        <span className="text-[10px] text-neutral-500">/ {stats.round2ShortlistedCount}</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
                                    <span className="text-[11px] text-neutral-400 font-medium block">AI Evaluated</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xl font-bold text-emerald-400">{stats.round2EvaluatedCount}</span>
                                        <span className="text-[10px] text-neutral-500">Codebases</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
                                    <span className="text-[11px] text-neutral-400 font-medium block">Pending Repo</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xl font-bold text-amber-400">{stats.round2PendingCount}</span>
                                        <span className="text-[10px] text-neutral-500">Awaiting</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
                                    <span className="text-[11px] text-neutral-400 font-medium block">Failed / Retry</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className={`text-xl font-bold ${stats.round2FailedCount > 0 ? 'text-red-400' : 'text-neutral-400'}`}>
                                            {stats.round2FailedCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-800/80 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <Input
                                placeholder="Search team or problem..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-neutral-900/70 border-neutral-800 text-sm h-9 text-white placeholder:text-neutral-500"
                            />
                        </div>

                        {/* Database Shortlist Filter Tabs */}
                        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                            <button
                                onClick={() => setShortlistStatusFilter('ALL')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${shortlistStatusFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                All Teams ({submissions.length})
                            </button>
                            <button
                                onClick={() => setShortlistStatusFilter('SHORTLISTED')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${shortlistStatusFilter === 'SHORTLISTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Shortlisted ({stats.persistentShortlistedCount})
                            </button>
                            <button
                                onClick={() => setShortlistStatusFilter('NOT_SHORTLISTED')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${shortlistStatusFilter === 'NOT_SHORTLISTED' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                Not Shortlisted
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <Filter className="w-3.5 h-3.5" /> Theme:
                        </div>
                        <select
                            value={selectedTrack}
                            onChange={(e) => setSelectedTrack(e.target.value)}
                            className="h-9 px-3 text-xs bg-neutral-900/80 border border-neutral-800 rounded-lg text-white"
                        >
                            <option value="ALL">All Themes</option>
                            <option value="General">General</option>
                            {uniqueTracks.filter((t) => t.toLowerCase() !== 'general').map((t, i) => (
                                <option key={i} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'SCORE_DESC' | 'SCORE_ASC' | 'NEWEST')}
                            className="h-9 px-3 text-xs bg-neutral-900/80 border border-neutral-800 rounded-lg text-white"
                        >
                            <option value="SCORE_DESC">Score (High to Low)</option>
                            <option value="SCORE_ASC">Score (Low to High)</option>
                            <option value="NEWEST">Newest First</option>
                        </select>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <Card className="border-primary/20 bg-background/60 backdrop-blur-md overflow-hidden">
                    <CardHeader className="py-4 border-b border-neutral-800/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-bold">
                                {shortlistStatusFilter === 'SHORTLISTED' ? '🏆 Round 2 Shortlisted Teams' : 'Ranked Submissions'}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs font-medium text-neutral-400 border-neutral-800">
                                Showing {filteredSubmissions.length} of {submissions.length} teams
                            </Badge>
                        </div>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">
                                Clear Search Filter
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="text-center py-16 text-neutral-400">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                Loading leaderboard data...
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16 text-neutral-400">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                No submissions match your filter.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-neutral-900/40">
                                    <TableRow className="border-neutral-800">
                                        <TableHead className="w-14 text-center">Rank</TableHead>
                                        <TableHead>Team & Track</TableHead>
                                        <TableHead className="hidden md:table-cell">Problem Statement</TableHead>
                                        <TableHead>Shortlist Status</TableHead>
                                        <TableHead>Round 2 Codebase</TableHead>
                                        <TableHead className="text-right">ATS Score</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.map((sub, idx) => {
                                        const score = sub.aiEvaluation?.totalScore;
                                        const isShortlisted = Boolean(sub.team?.isShortlisted);
                                        const rankDisplay = isShortlisted && sub.team?.shortlistRank ? `#${sub.team.shortlistRank}` : idx + 1;
                                        const isTop3 = isShortlisted && (sub.team?.shortlistRank ?? idx + 1) <= 3;

                                        return (
                                            <TableRow key={sub._id?.toString()} className="border-neutral-800/60 hover:bg-neutral-900/30 transition-colors">
                                                <TableCell className="text-center font-bold text-xs text-neutral-400">
                                                    {isTop3 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                                                            {rankDisplay}
                                                        </span>
                                                    ) : (
                                                        rankDisplay
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-white flex items-center gap-2">
                                                        {blindJudgingEnabled ? `Team #${idx + 1} (Redacted)` : (sub.team?.name || 'Unknown Team')}
                                                        {sub.aiEvaluation?.plagiarismFlag && (
                                                            <Badge variant="destructive" className="bg-amber-900/40 text-amber-300 text-[10px] px-1.5 py-0 border-amber-800">
                                                                Cliche Flag
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {sub.team?.projectTitle && (
                                                        <p className="text-xs text-primary font-medium">{sub.team.projectTitle}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-indigo-400">
                                                            {sub.team?.track || 'General'} Track
                                                        </span>
                                                        {sub.hackathon?.name && (
                                                            <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                                                {sub.hackathon.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-xs text-neutral-400 max-w-xs truncate">
                                                    {sub.team?.problemStatement || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {isShortlisted ? (
                                                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                                🏆 Shortlisted {sub.team?.shortlistRank ? `(#${sub.team.shortlistRank})` : ''}
                                                            </Badge>
                                                        ) : sub.status === 'EVALUATED' ? (
                                                            <Badge variant="outline" className="text-neutral-500 border-neutral-800 text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                                Evaluated
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-amber-400 bg-amber-500/10 border-amber-500/20 text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                                {sub.status || 'Pending'}
                                                            </Badge>
                                                        )}
                                                        {isShortlisted && sub.team?.shortlistedAt && (
                                                            <span className="text-[9px] text-neutral-500">
                                                                {new Date(sub.team.shortlistedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isShortlisted ? (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {sub.githubEvaluation?.status === 'EVALUATED' ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-1.5 py-0 font-bold">
                                                                        {sub.githubEvaluation.technicalScore}/100
                                                                    </Badge>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => setSelectedCodeReport(sub)}
                                                                        className="h-6 px-1.5 text-[11px] text-indigo-400 hover:text-white"
                                                                    >
                                                                        <Eye className="w-3 h-3 mr-1" /> Audit
                                                                    </Button>
                                                                </div>
                                                            ) : sub.githubEvaluation?.status === 'ANALYZING' ? (
                                                                <Badge className="bg-indigo-900/40 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0">
                                                                    <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> Analyzing
                                                                </Badge>
                                                            ) : sub.githubEvaluation?.status === 'FAILED' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                                        Failed
                                                                    </Badge>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        disabled={retryingTeamId === sub.team?._id?.toString()}
                                                                        onClick={() => sub.team?._id && handleRetryCodeAnalysis(sub.team._id.toString())}
                                                                        className="h-5 px-1 text-[10px] text-amber-400 hover:text-white"
                                                                    >
                                                                        <RefreshCw className={`w-2.5 h-2.5 mr-0.5 ${retryingTeamId === sub.team?._id?.toString() ? 'animate-spin' : ''}`} /> Retry
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline" className="text-neutral-500 border-neutral-800 text-[10px] px-1.5 py-0">
                                                                    Pending Repo
                                                                </Badge>
                                                            )}
                                                            {(sub.githubEvaluation?.repoUrl || sub.team?.githubUrl) && (
                                                                <a
                                                                    href={sub.githubEvaluation?.repoUrl || sub.team.githubUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] text-indigo-400/80 hover:text-indigo-300 flex items-center gap-1 max-w-[140px] truncate"
                                                                >
                                                                    <Github className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">
                                                                        {sub.githubEvaluation?.repoOwner ? `${sub.githubEvaluation.repoOwner}/${sub.githubEvaluation.repoName}` : 'repo'}
                                                                    </span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-600">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-lg">
                                                    {score !== undefined ? (
                                                        <span className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-primary' : 'text-amber-400'}>
                                                            {score}
                                                            <span className="text-xs text-neutral-500 font-normal">/100</span>
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm" className="h-8 text-xs border-neutral-800 hover:bg-neutral-800" disabled={sub.status !== 'EVALUATED'}>
                                                        <Link href={`/admin/submission/${sub._id}`}>
                                                            Scorecard <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* AI Code Report Modal Overlay */}
                {selectedCodeReport && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
                                            Rank #{selectedCodeReport.team?.shortlistRank || '—'}
                                        </Badge>
                                        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-xs">
                                            {selectedCodeReport.team?.track || 'General'} Track
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Github className="w-5 h-5 text-indigo-400" />
                                        {selectedCodeReport.team?.name}
                                    </h3>
                                    {selectedCodeReport.githubEvaluation?.repoUrl && (
                                        <a
                                            href={selectedCodeReport.githubEvaluation.repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                                        >
                                            {selectedCodeReport.githubEvaluation.repoUrl} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Technical Score</span>
                                        <span className="text-2xl font-extrabold text-emerald-400 block">
                                            {selectedCodeReport.githubEvaluation?.technicalScore ?? '—'} <span className="text-xs text-neutral-500 font-normal">/ 100</span>
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedCodeReport(null)}
                                        className="text-neutral-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Rubric Breakdown */}
                            {selectedCodeReport.githubEvaluation?.breakdown && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                        Rubric Breakdown (Out of 100)
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 text-center">
                                            <span className="text-[11px] text-neutral-400 block">Code Quality</span>
                                            <span className="font-bold text-white text-base block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.codeQuality} <span className="text-[10px] text-neutral-500">/25</span>
                                            </span>
                                        </div>
                                        <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 text-center">
                                            <span className="text-[11px] text-neutral-400 block">Implementation</span>
                                            <span className="font-bold text-white text-base block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.technicalImplementation} <span className="text-[10px] text-neutral-500">/25</span>
                                            </span>
                                        </div>
                                        <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 text-center">
                                            <span className="text-[11px] text-neutral-400 block">Architecture</span>
                                            <span className="font-bold text-white text-base block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.architecture} <span className="text-[10px] text-neutral-500">/20</span>
                                            </span>
                                        </div>
                                        <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 text-center">
                                            <span className="text-[11px] text-neutral-400 block">Commits</span>
                                            <span className="font-bold text-white text-base block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.developmentActivity} <span className="text-[10px] text-neutral-500">/15</span>
                                            </span>
                                        </div>
                                        <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 text-center">
                                            <span className="text-[11px] text-neutral-400 block">Testing & Docs</span>
                                            <span className="font-bold text-white text-base block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.documentationAndTesting} <span className="text-[10px] text-neutral-500">/15</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            {selectedCodeReport.githubEvaluation?.summary && (
                                <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 space-y-1">
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Executive Technical Summary
                                    </h4>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        {selectedCodeReport.githubEvaluation.summary}
                                    </p>
                                </div>
                            )}

                            {/* Detailed Feedback */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {selectedCodeReport.githubEvaluation?.architectureAssessment && (
                                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 space-y-1">
                                        <h5 className="font-bold text-indigo-400 uppercase text-[11px]">System Architecture</h5>
                                        <p className="text-neutral-300 leading-relaxed">{selectedCodeReport.githubEvaluation.architectureAssessment}</p>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.codeQualityAssessment && (
                                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 space-y-1">
                                        <h5 className="font-bold text-indigo-400 uppercase text-[11px]">Code Quality & Hygiene</h5>
                                        <p className="text-neutral-300 leading-relaxed">{selectedCodeReport.githubEvaluation.codeQualityAssessment}</p>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.testingAssessment && (
                                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 space-y-1">
                                        <h5 className="font-bold text-indigo-400 uppercase text-[11px]">Automated Testing Evidence</h5>
                                        <p className="text-neutral-300 leading-relaxed">{selectedCodeReport.githubEvaluation.testingAssessment}</p>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.criteriaFeedback?.developmentActivity && (
                                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 space-y-1">
                                        <h5 className="font-bold text-indigo-400 uppercase text-[11px]">Commit Effort & Cadence</h5>
                                        <p className="text-neutral-300 leading-relaxed">{selectedCodeReport.githubEvaluation.criteriaFeedback.developmentActivity}</p>
                                    </div>
                                )}
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedCodeReport.githubEvaluation?.strengths && selectedCodeReport.githubEvaluation.strengths.length > 0 && (
                                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg space-y-1">
                                        <h5 className="text-[11px] font-bold text-emerald-400 uppercase">Key Strengths</h5>
                                        <ul className="text-xs text-neutral-300 space-y-1">
                                            {selectedCodeReport.githubEvaluation.strengths.map((s, i) => (
                                                <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-400">•</span> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.weaknesses && selectedCodeReport.githubEvaluation.weaknesses.length > 0 && (
                                    <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg space-y-1">
                                        <h5 className="text-[11px] font-bold text-red-400 uppercase">Technical Weaknesses</h5>
                                        <ul className="text-xs text-neutral-300 space-y-1">
                                            {selectedCodeReport.githubEvaluation.weaknesses.map((w, i) => (
                                                <li key={i} className="flex items-start gap-1.5"><span className="text-red-400">•</span> {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCodeReport(null)}
                                    className="border-neutral-800 text-neutral-300"
                                >
                                    Close
                                </Button>
                                {selectedCodeReport.team?._id && (
                                    <Button
                                        size="sm"
                                        disabled={retryingTeamId === selectedCodeReport.team._id.toString()}
                                        onClick={() => {
                                            if (selectedCodeReport.team?._id) {
                                                handleRetryCodeAnalysis(selectedCodeReport.team._id.toString());
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                                    >
                                        {retryingTeamId === selectedCodeReport.team._id.toString() ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Retrying...</>
                                        ) : (
                                            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-Run Analysis</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
