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
    Github, Loader2, Eye, X, Award, Crown, ShieldCheck
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
    pitchWeight?: number;
    githubWeight?: number;
    isFinalResultsPublished?: boolean;
    finalResultsPublishedAt?: string;
    finalResultsPublishedBy?: string;
    winnerCount?: number;
    finalRankingRecalculatedAt?: string;
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

interface IFinalRankingPreviewTeam {
    finalRank: number;
    teamId: string;
    teamName: string;
    track: string;
    projectTitle?: string;
    pitchScore: number;
    githubScore: number;
    finalScore: number;
    status: 'COMPLETE' | 'PENDING_CODE' | 'FAILED_CODE' | 'PENDING_PITCH';
    isWinner: boolean;
    winnerPosition?: number;
}

interface IFinalRankingPreviewResult {
    pitchWeight: number;
    githubWeight: number;
    totalEligible: number;
    rankedCount: number;
    incompleteCount: number;
    rankings: IFinalRankingPreviewTeam[];
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
    const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'NEWEST' | 'FINAL_RANK'>('SCORE_DESC');
    const [shortlistStatusFilter, setShortlistStatusFilter] = useState<'ALL' | 'EVALUATED' | 'PENDING' | 'SHORTLISTED' | 'NOT_SHORTLISTED' | 'FINAL_RANKING'>('ALL');

    // Organizer Shortlisting Controls State
    const [showShortlistPanel, setShowShortlistPanel] = useState(false);
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

    // Phase 6: Final Composite Ranking & Winner Selection State
    const [showFinalPanel, setShowFinalPanel] = useState(true);
    const [pitchWeight, setPitchWeight] = useState<number>(0);
    const [githubWeight, setGithubWeight] = useState<number>(100);
    const [winnerCount, setWinnerCount] = useState<number>(3);
    const [finalPreviewData, setFinalPreviewData] = useState<IFinalRankingPreviewResult | null>(null);
    const [isPreviewingFinal, setIsPreviewingFinal] = useState(false);
    const [isCalculatingFinal, setIsCalculatingFinal] = useState(false);
    const [isPublishingFinal, setIsPublishingFinal] = useState(false);
    const [isUnpublishingFinal, setIsUnpublishingFinal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [finalRankingNotification, setFinalRankingNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
            const queryParam = hId !== 'ALL' ? `?hackathonId=${hId}` : '';
            const res = await fetch(`/api/settings${queryParam}`);
            const data = await res.json();
            if (data.success) {
                setIsCodeSubmissionOpen(data.isCodeSubmissionOpen);
                setBlindJudgingEnabled(data.blindJudgingEnabled);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    }, [selectedHackathonId]);

    const fetchSubmissions = useCallback(async (hId: string = selectedHackathonId) => {
        setLoading(true);
        try {
            const queryParam = hId !== 'ALL' ? `?hackathonId=${hId}` : '';
            const res = await fetch(`/api/submissions${queryParam}`);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedHackathonId]);

    useEffect(() => {
        fetchHackathons();
        fetchSettings();
        fetchSubmissions();
    }, [fetchSettings, fetchSubmissions]);

    const handleHackathonChange = (hId: string) => {
        setSelectedHackathonId(hId);
        fetchSettings(hId);
        fetchSubmissions(hId);
        setPreviewData(null);
        setFinalPreviewData(null);
    };

    const togglePhase = async () => {
        setUpdatingPhase(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isCodeSubmissionOpen: !isCodeSubmissionOpen,
                    hackathonId: selectedHackathonId !== 'ALL' ? selectedHackathonId : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCodeSubmissionOpen(data.isCodeSubmissionOpen);
            }
        } catch (error) {
            console.error('Failed to update phase:', error);
        } finally {
            setUpdatingPhase(false);
        }
    };

    const uniqueTracks = useMemo(() => {
        const tracks = new Set<string>();
        submissions.forEach((s) => {
            if (s.team?.track) tracks.add(s.team.track);
        });
        return Array.from(tracks);
    }, [submissions]);

    const activeHackathon = useMemo(() => {
        if (selectedHackathonId === 'ALL') return null;
        return hackathons.find((h) => h._id === selectedHackathonId) || null;
    }, [hackathons, selectedHackathonId]);

    // Summary Statistics
    const stats = useMemo(() => {
        const total = submissions.length;
        if (total === 0) return {
            total: 0, highest: 0, topTeam: 'N/A', average: 0,
            plagiarismCount: 0, persistentShortlistedCount: 0,
            round2ShortlistedCount: 0, round2SubmittedCount: 0,
            round2PendingCount: 0, round2EvaluatedCount: 0,
            round2FailedCount: 0,
            finalRankedCount: 0, winnersCount: 0
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
        let finalRankedCount = 0;
        let winnersCount = 0;

        submissions.forEach((sub) => {
            const score = typeof sub.githubEvaluation?.technicalScore === 'number'
                ? sub.githubEvaluation.technicalScore
                : (typeof sub.team?.githubScore === 'number' ? sub.team.githubScore : 0);
            if (score > highest) {
                highest = score;
                topTeam = sub.team?.name || 'Unknown';
            }
            if (typeof sub.githubEvaluation?.technicalScore === 'number' || typeof sub.team?.githubScore === 'number') {
                totalScoreSum += score;
                evaluatedCount++;
            }
            if (sub.aiEvaluation?.plagiarismFlag) {
                plagiarismCount++;
            }
            if (sub.team?.isShortlisted) {
                persistentShortlistedCount++;
            }
            if (sub.githubEvaluation?.repoUrl || sub.team?.githubUrl) {
                round2SubmittedCount++;
                round2ShortlistedCount++;
            }
            if (sub.githubEvaluation?.status === 'EVALUATED') {
                round2EvaluatedCount++;
            } else if (sub.githubEvaluation?.status === 'FAILED') {
                round2FailedCount++;
            }
            if (sub.finalScore !== undefined || sub.team?.finalScore !== undefined) {
                finalRankedCount++;
            }
            if (sub.isWinner || sub.team?.isWinner) {
                winnersCount++;
            }
        });

        const average = evaluatedCount > 0 ? Math.round(totalScoreSum / evaluatedCount) : 0;
        const round2PendingCount = Math.max(0, total - round2EvaluatedCount);

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
            round2FailedCount,
            finalRankedCount,
            winnersCount
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
                    (shortlistStatusFilter === 'EVALUATED' && (sub.githubEvaluation?.status === 'EVALUATED' || typeof sub.githubEvaluation?.technicalScore === 'number' || typeof sub.team?.githubScore === 'number')) ||
                    (shortlistStatusFilter === 'PENDING' && sub.githubEvaluation?.status !== 'EVALUATED' && typeof sub.githubEvaluation?.technicalScore !== 'number' && typeof sub.team?.githubScore !== 'number') ||
                    (shortlistStatusFilter === 'SHORTLISTED' && (sub.team?.isShortlisted || sub.githubEvaluation?.status === 'EVALUATED')) ||
                    (shortlistStatusFilter === 'FINAL_RANKING' && (sub.finalScore !== undefined || sub.team?.finalScore !== undefined || sub.finalRank !== undefined || sub.team?.finalRank !== undefined));

                return matchesSearch && matchesTrack && matchesShortlistFilter;
            })
            .sort((a, b) => {
                if (sortBy === 'FINAL_RANK') {
                    const rankA = a.finalRank ?? a.team?.finalRank ?? 999999;
                    const rankB = b.finalRank ?? b.team?.finalRank ?? 999999;
                    if (rankA !== rankB) return rankA - rankB;
                    const scoreA = a.finalScore ?? a.team?.finalScore ?? -1;
                    const scoreB = b.finalScore ?? b.team?.finalScore ?? -1;
                    return scoreB - scoreA;
                }
                const scoreA = typeof a.githubEvaluation?.technicalScore === 'number'
                    ? a.githubEvaluation.technicalScore
                    : (typeof a.team?.githubScore === 'number' ? a.team.githubScore : (a.finalScore ?? a.team?.finalScore ?? -1));
                const scoreB = typeof b.githubEvaluation?.technicalScore === 'number'
                    ? b.githubEvaluation.technicalScore
                    : (typeof b.team?.githubScore === 'number' ? b.team.githubScore : (b.finalScore ?? b.team?.finalScore ?? -1));

                if (sortBy === 'SCORE_DESC') return scoreB - scoreA;
                if (sortBy === 'SCORE_ASC') return scoreA - scoreB;
                if (sortBy === 'NEWEST') {
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                }
                return 0;
            });
    }, [submissions, searchQuery, selectedTrack, shortlistStatusFilter, sortBy]);

    // Shortlisting Actions
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

    // Final Composite Ranking Actions
    const handlePreviewFinalRankings = async () => {
        if (!activeHackathon) {
            setFinalRankingNotification({ type: 'error', message: 'Please select a specific hackathon to configure final rankings.' });
            return;
        }
        if (pitchWeight + githubWeight !== 100) {
            setFinalRankingNotification({ type: 'error', message: 'Pitch and GitHub weights must total exactly 100%.' });
            return;
        }

        setIsPreviewingFinal(true);
        setFinalRankingNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/final-rankings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'preview',
                    pitchWeight,
                    githubWeight,
                    winnerCount
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFinalPreviewData(data.data);
                setFinalRankingNotification({
                    type: 'success',
                    message: `Dry-run preview generated: ${data.data.rankedCount} teams ranked deterministically (${data.data.incompleteCount} pending code/failed).`
                });
            } else {
                setFinalRankingNotification({ type: 'error', message: data.error || 'Failed to preview final rankings.' });
            }
        } catch {
            setFinalRankingNotification({ type: 'error', message: 'Network error generating final ranking preview.' });
        } finally {
            setIsPreviewingFinal(false);
        }
    };

    const handleCalculateFinalRankings = async () => {
        if (!activeHackathon) {
            setFinalRankingNotification({ type: 'error', message: 'Please select a specific hackathon to calculate final rankings.' });
            return;
        }
        if (pitchWeight + githubWeight !== 100) {
            setFinalRankingNotification({ type: 'error', message: 'Pitch and GitHub weights must total exactly 100%.' });
            return;
        }

        setIsCalculatingFinal(true);
        setFinalRankingNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/final-rankings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate',
                    pitchWeight,
                    githubWeight
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFinalRankingNotification({
                    type: 'success',
                    message: `Successfully calculated and persisted final rankings for ${data.data.rankedCount} teams! MongoDB updated.`
                });
                setFinalPreviewData(null);
                fetchSubmissions(selectedHackathonId);
                fetchHackathons();
            } else {
                setFinalRankingNotification({ type: 'error', message: data.error || 'Failed to persist final rankings.' });
            }
        } catch {
            setFinalRankingNotification({ type: 'error', message: 'Network error calculating final rankings.' });
        } finally {
            setIsCalculatingFinal(false);
        }
    };

    const handlePublishFinalResults = async () => {
        if (!activeHackathon) {
            setFinalRankingNotification({ type: 'error', message: 'Please select a specific hackathon to publish results.' });
            return;
        }

        setIsPublishingFinal(true);
        setFinalRankingNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/final-rankings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'publish',
                    winnerCount
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFinalRankingNotification({
                    type: 'success',
                    message: `Official Final Results & Top ${data.data.winnerCount} Winners Published! Participants can now view their official rank & badges.`
                });
                setShowPublishModal(false);
                fetchSubmissions(selectedHackathonId);
                fetchHackathons();
            } else {
                setFinalRankingNotification({ type: 'error', message: data.error || 'Failed to publish final results.' });
            }
        } catch {
            setFinalRankingNotification({ type: 'error', message: 'Network error publishing final results.' });
        } finally {
            setIsPublishingFinal(false);
        }
    };

    const handleUnpublishFinalResults = async () => {
        if (!activeHackathon) {
            setFinalRankingNotification({ type: 'error', message: 'Please select a specific hackathon.' });
            return;
        }

        setIsUnpublishingFinal(true);
        setFinalRankingNotification(null);

        try {
            const res = await fetch(`/api/hackathons/${activeHackathon._id}/final-rankings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unpublish'
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFinalRankingNotification({
                    type: 'success',
                    message: 'Final results have been unpublished. Rankings and winner badges are now masked from participants.'
                });
                fetchSubmissions(selectedHackathonId);
                fetchHackathons();
            } else {
                setFinalRankingNotification({ type: 'error', message: data.error || 'Failed to unpublish final results.' });
            }
        } catch {
            setFinalRankingNotification({ type: 'error', message: 'Network error unpublishing results.' });
        } finally {
            setIsUnpublishingFinal(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Repository Checker & Leaderboard
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Repository Evaluation Leaderboard</h1>
                        <p className="text-slate-500 text-sm mt-1">Automated code quality audit, system architecture evaluation, and deterministic rankings.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Hackathon Filter Dropdown */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                            <Trophy className="w-4 h-4 text-indigo-600 ml-1 shrink-0" />
                            <select
                                value={selectedHackathonId}
                                onChange={(e) => handleHackathonChange(e.target.value)}
                                className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px] truncate"
                            >
                                <option value="ALL">All Hackathons</option>
                                {hackathons.map((h) => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phase 2 Code Submission Toggle */}
                        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-xs">
                            <div className="text-left">
                                <div className="text-xs font-bold text-slate-900">Phase 2 Code Submission</div>
                                <div className={`text-[11px] font-semibold ${isCodeSubmissionOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {isCodeSubmissionOpen ? '● Portal Unlocked' : '○ Locked'}
                                </div>
                            </div>
                            <button
                                onClick={togglePhase}
                                disabled={updatingPhase}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-indigo-500 ${isCodeSubmissionOpen ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${isCodeSubmissionOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs text-xs font-semibold">
                                <Link href="/admin/hackathons">
                                    <Trophy className="h-4 w-4 mr-1.5 text-indigo-600" /> Event Settings
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs text-xs font-semibold">
                                <a
                                    href={`/api/export?${shortlistStatusFilter === 'SHORTLISTED' ? 'shortlistedOnly=true&' : ''}${selectedHackathonId !== 'ALL' ? `hackathonId=${selectedHackathonId}&` : ''}${selectedTrack !== 'ALL' ? `track=${selectedTrack}` : ''}`}
                                    download={shortlistStatusFilter === 'SHORTLISTED' ? 'shortlisted_teams.csv' : 'hackathon_leaderboard.csv'}
                                >
                                    <Download className="h-4 w-4 mr-1.5" />
                                    {shortlistStatusFilter === 'SHORTLISTED' ? 'Export Shortlisted' : 'Export CSV'}
                                </a>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-xs text-xs font-semibold">
                                <a
                                    href={`/api/export?finalRanking=true${selectedHackathonId !== 'ALL' ? `&hackathonId=${selectedHackathonId}` : ''}${selectedTrack !== 'ALL' ? `&track=${selectedTrack}` : ''}`}
                                    download="hackathon_final_leaderboard.csv"
                                >
                                    <Crown className="h-4 w-4 mr-1.5 text-amber-600" />
                                    Export Final Rankings
                                </a>
                            </Button>
                            <Button onClick={() => fetchSubmissions(selectedHackathonId)} variant="outline" size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Teams</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <Github className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Codebases Evaluated</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                                    {stats.round2EvaluatedCount} <span className="text-xs font-semibold text-emerald-600">Repositories</span>
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Leaderboard Ranked</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                                    {stats.finalRankedCount} <span className="text-xs font-semibold text-blue-600">Teams</span>
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <Crown className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Official Winners</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                                    {activeHackathon?.isFinalResultsPublished ? (
                                        <>
                                            {stats.winnersCount || activeHackathon.winnerCount || 3}{' '}
                                            <span className="text-xs font-bold text-emerald-600">Published</span>
                                        </>
                                    ) : (
                                        <span className="text-sm font-bold text-amber-600">Draft / Review</span>
                                    )}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shortlisting Engine Panel */}
                <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors" onClick={() => setShowShortlistPanel(!showShortlistPanel)}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    Round 2 Automatic Shortlisting Engine
                                    {activeHackathon?.shortlistingStatus === 'SHORTLISTED' && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                            ● Shortlist Saved in MongoDB ({activeHackathon.shortlistCount} Teams)
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Sort eligible evaluated teams, select Top N or theme-wise quotas, and persist qualification status directly into MongoDB.
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                            {showShortlistPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </CardHeader>

                    {showShortlistPanel && (
                        <CardContent className="p-6 space-y-6">
                            {/* Notification Banner */}
                            {shortlistNotification && (
                                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${shortlistNotification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                    {shortlistNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                                    <span>{shortlistNotification.message}</span>
                                </div>
                            )}

                            {/* Mode Selection Tabs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shortlisting Mode</label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => { setShortlistMode('OVERALL'); setPreviewData(null); }}
                                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${shortlistMode === 'OVERALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            <Trophy className="w-3.5 h-3.5" /> Overall Ranking
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShortlistMode('THEME_WISE'); setPreviewData(null); }}
                                            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${shortlistMode === 'THEME_WISE' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            <Sliders className="w-3.5 h-3.5" /> Theme-Wise Quotas
                                        </button>
                                    </div>
                                </div>

                                {shortlistMode === 'OVERALL' ? (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Team Count</label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {[10, 25, 30].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => { setShortlistLimit(n); setPreviewData(null); }}
                                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${shortlistLimit === n ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    Top {n}
                                                </button>
                                            ))}
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                                                <span className="text-xs text-slate-500">Custom N:</span>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={500}
                                                    value={shortlistLimit}
                                                    onChange={(e) => { setShortlistLimit(Math.max(1, parseInt(e.target.value, 10) || 1)); setPreviewData(null); }}
                                                    className="w-16 h-7 text-xs bg-white border-slate-200 text-slate-900 font-bold text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Per-Theme Quotas</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                            {uniqueTracks.map((t, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                                    <span className="truncate max-w-[120px] font-medium text-slate-800">{t}</span>
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
                                                        className="w-14 h-6 text-xs bg-white border-slate-200 text-slate-900 text-center font-bold"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Shortlist Action Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                <div className="text-xs text-slate-500">
                                    Event in Scope: <span className="text-slate-900 font-bold">{activeHackathon ? activeHackathon.name : 'All Events'}</span>
                                    {activeHackathon?.shortlistedAt && (
                                        <span className="text-emerald-700 ml-2 font-medium">
                                            (Last shortlisted: {new Date(activeHackathon.shortlistedAt).toLocaleDateString()})
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
                                        className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                                    >
                                        {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                                        Preview Qualifying Teams
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isApplyingShortlist}
                                        onClick={handleApplyShortlist}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                    >
                                        {isApplyingShortlist ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trophy className="w-3.5 h-3.5 mr-1.5" />}
                                        Confirm & Persist to Database
                                    </Button>
                                </div>
                            </div>

                            {/* Shortlist Preview Drawer */}
                            {previewData && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-emerald-300 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                                                Preview: Top {previewData.qualifyingCount} Teams
                                            </Badge>
                                            <span className="text-xs text-slate-600">
                                                Total Evaluated Candidates: <strong className="text-slate-900">{previewData.totalEligible}</strong>
                                            </span>
                                            <span className="text-xs text-slate-600">
                                                Cutoff Score: <strong className="text-emerald-700">{previewData.cutoffScore}/100</strong>
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleApplyShortlist}
                                            disabled={isApplyingShortlist}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 shadow-xs"
                                        >
                                            {isApplyingShortlist ? 'Saving to Database...' : 'Save this Shortlist in MongoDB'}
                                        </Button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                        {previewData.qualifyingTeams.map((qt) => (
                                            <div key={qt.teamId} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                                        {qt.rank}
                                                    </span>
                                                    <span className="font-bold text-slate-900">{qt.teamName}</span>
                                                    <Badge variant="outline" className="text-[10px] py-0 border-indigo-200 text-indigo-700 bg-indigo-50">
                                                        {qt.track}
                                                    </Badge>
                                                </div>
                                                <span className="font-extrabold text-emerald-700 text-sm">{qt.score}/100</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Round 2 Codebase Evaluation Management Center */}
                <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader
                        className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowRound2Panel(!showRound2Panel)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                                <Github className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    Round 2 Codebase Evaluation Center
                                    <Badge className={isCodeSubmissionOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold" : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"}>
                                        {isCodeSubmissionOpen ? "● Code Portal Unlocked" : "○ Code Portal Locked"}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
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
                                className="text-xs h-8 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs font-semibold"
                            >
                                {updatingPhase ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                {isCodeSubmissionOpen ? 'Lock Round 2' : 'Unlock Round 2'}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400">
                                {showRound2Panel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardHeader>

                    {showRound2Panel && (
                        <CardContent className="p-6 space-y-6">
                            {/* Notification */}
                            {round2Notification && (
                                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${round2Notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                    {round2Notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                                    <span>{round2Notification.message}</span>
                                </div>
                            )}

                            {/* Round 2 Statistics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                                    <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Eligible Shortlisted</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-black text-slate-900">{stats.round2ShortlistedCount}</span>
                                        <span className="text-[11px] text-emerald-700 font-semibold">Teams</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                                    <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Repos Submitted</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-black text-indigo-700">{stats.round2SubmittedCount}</span>
                                        <span className="text-[11px] text-slate-400 font-medium">/ {stats.round2ShortlistedCount}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                                    <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">AI Evaluated</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-black text-emerald-700">{stats.round2EvaluatedCount}</span>
                                        <span className="text-[11px] text-slate-400 font-medium">Codebases</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                                    <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Pending Repo</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-black text-amber-700">{stats.round2PendingCount}</span>
                                        <span className="text-[11px] text-slate-400 font-medium">Awaiting</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                                    <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Failed / Retry</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className={`text-2xl font-black ${stats.round2FailedCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                                            {stats.round2FailedCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Final Composite Ranking & Winner Selection Engine */}
                <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader
                        className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowFinalPanel(!showFinalPanel)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                                <Crown className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    Final Composite Ranking & Winner Selection Engine
                                    {activeHackathon?.isFinalResultsPublished ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                            ● Published ({activeHackathon.winnerCount || 3} Winners Announced)
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                            ○ Results Draft / Masked from Participants
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Configure 100% GitHub Technical evaluation weight, preview deterministic ties, and publish official winners.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeHackathon?.isFinalResultsPublished ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isUnpublishingFinal}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnpublishFinalResults();
                                    }}
                                    className="text-xs h-8 bg-white border-amber-200 text-amber-800 hover:bg-amber-50 shadow-xs font-semibold"
                                >
                                    {isUnpublishingFinal ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                    Unpublish Results
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={isPublishingFinal}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPublishModal(true);
                                    }}
                                    className="text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
                                >
                                    <Crown className="w-3.5 h-3.5 mr-1" />
                                    Publish Final Results
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-slate-400">
                                {showFinalPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardHeader>

                    {showFinalPanel && (
                        <CardContent className="p-6 space-y-6">
                            {/* Notification Banner */}
                            {finalRankingNotification && (
                                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${finalRankingNotification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                    {finalRankingNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                                    <span>{finalRankingNotification.message}</span>
                                </div>
                            )}

                            {/* Weight Configuration and Winner Selection Controls */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Evaluation Weights */}
                                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5 text-amber-600" /> Repository Ranking Configuration
                                        </h4>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-mono font-bold border-emerald-300 text-emerald-800 bg-emerald-50"
                                        >
                                            100% Repository Score
                                        </Badge>
                                    </div>

                                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700 shadow-xs">
                                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Pure Codebase Evaluation Ranking
                                        </p>
                                        <p className="text-slate-500 leading-relaxed text-[11px]">
                                            Final rankings and winner determinations are computed server-side directly from Gemini&apos;s 100-point technical rubric (Code Quality 25, Implementation 25, Architecture 20, Testing 15, Docs &amp; Git 15).
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isPreviewingFinal || isCalculatingFinal}
                                            onClick={handlePreviewFinalRankings}
                                            className="text-xs h-8 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs font-semibold"
                                        >
                                            {isPreviewingFinal ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                                            Preview Repository Rankings
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isCalculatingFinal}
                                            onClick={handleCalculateFinalRankings}
                                            className="text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
                                        >
                                            {isCalculatingFinal ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Crown className="w-3.5 h-3.5 mr-1.5" />}
                                            Calculate &amp; Save Rankings
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Column: Winner Selection & Official Publication */}
                                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                                <Award className="w-3.5 h-3.5 text-amber-600" /> Podium &amp; Winner Selection
                                            </h4>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                Target Finalists: <strong className="text-slate-900">{winnerCount}</strong>
                                            </span>
                                        </div>

                                        {/* Winner Count Selector */}
                                        <div className="space-y-2">
                                            <label className="text-[11px] text-slate-600 font-semibold block">Number of Official Winners</label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {[3, 5, 10].map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setWinnerCount(n)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${winnerCount === n ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        Top {n} {n === 3 ? '(Podium)' : 'Finalists'}
                                                    </button>
                                                ))}
                                                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                    <span className="text-[11px] text-slate-500">Custom:</span>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        value={winnerCount}
                                                        onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                        className="w-14 h-6 text-xs bg-slate-50 border-slate-200 text-slate-900 font-bold text-center"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Publication Status & Action */}
                                    <div className="pt-3 border-t border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Participant Visibility:</span>
                                            {activeHackathon?.isFinalResultsPublished ? (
                                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Visible in Participant Dashboard
                                                </span>
                                            ) : (
                                                <span className="text-amber-700 font-bold flex items-center gap-1">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Hidden from Participants (Draft Mode)
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {activeHackathon?.isFinalResultsPublished ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isUnpublishingFinal}
                                                    onClick={handleUnpublishFinalResults}
                                                    className="w-full text-xs h-8 bg-white border-amber-200 text-amber-800 hover:bg-amber-50 shadow-xs font-semibold"
                                                >
                                                    {isUnpublishingFinal ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                                    Unpublish Results (Revert to Draft)
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={isPublishingFinal}
                                                    onClick={() => setShowPublishModal(true)}
                                                    className="w-full text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
                                                >
                                                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                                                    Publish Final Results &amp; Declare Top {winnerCount} Winners
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dry-Run Ranking Preview Drawer */}
                            {finalPreviewData && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-amber-300 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                                                Dry-Run Preview: {finalPreviewData.rankedCount} Teams Ranked
                                            </Badge>
                                            <span className="text-xs text-slate-600">
                                                Weights: <strong className="text-slate-900">100% Code</strong>
                                            </span>
                                            {finalPreviewData.incompleteCount > 0 && (
                                                <span className="text-xs text-amber-700 font-medium">
                                                    Incomplete: <strong>{finalPreviewData.incompleteCount} Teams Pending Code</strong>
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCalculateFinalRankings}
                                            disabled={isCalculatingFinal}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-7 shadow-xs"
                                        >
                                            {isCalculatingFinal ? 'Saving to Database...' : 'Save this Ranking in MongoDB'}
                                        </Button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                        {finalPreviewData.rankings.map((rt) => {
                                            const isTopPodium = rt.finalRank <= winnerCount;
                                            return (
                                                <div
                                                    key={rt.teamId}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border ${isTopPodium ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200 shadow-xs'}`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${rt.finalRank === 1 ? 'bg-amber-500 text-white' : rt.finalRank === 2 ? 'bg-slate-400 text-white' : rt.finalRank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                            #{rt.finalRank}
                                                        </span>
                                                        <span className="font-bold text-slate-900">{rt.teamName}</span>
                                                        <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-600 bg-white">
                                                            {rt.track}
                                                        </Badge>
                                                        {rt.finalRank === 1 && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">1st Champion</Badge>}
                                                        {rt.finalRank === 2 && <Badge className="bg-slate-200 text-slate-800 border-slate-300 text-[10px] font-bold">2nd Place</Badge>}
                                                        {rt.finalRank === 3 && <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">3rd Place</Badge>}
                                                        {rt.finalRank > 3 && rt.finalRank <= winnerCount && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold">Finalist</Badge>}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] text-slate-600">
                                                            Code Score: <strong className="text-slate-900">{rt.githubScore}</strong>
                                                        </span>
                                                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                                                            <span className="font-black text-amber-700 text-xs">
                                                                {rt.finalScore} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search team or problem..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-slate-50 border-slate-200 text-sm h-9 text-slate-900 placeholder:text-slate-400 rounded-xl"
                            />
                        </div>

                        {/* Repository Evaluation Filter Tabs */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setShortlistStatusFilter('ALL')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${shortlistStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                All Repos ({submissions.length})
                            </button>
                            <button
                                onClick={() => setShortlistStatusFilter('EVALUATED')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${shortlistStatusFilter === 'EVALUATED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                <Github className="w-3.5 h-3.5 text-emerald-600" /> Evaluated ({stats.round2EvaluatedCount})
                            </button>
                            <button
                                onClick={() => {
                                    setShortlistStatusFilter('FINAL_RANKING');
                                    setSortBy('FINAL_RANK');
                                }}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${shortlistStatusFilter === 'FINAL_RANKING' ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-600" /> Leaderboard ({stats.finalRankedCount})
                            </button>
                            <button
                                onClick={() => setShortlistStatusFilter('PENDING')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${shortlistStatusFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Pending ({stats.round2PendingCount})
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Filter className="w-3.5 h-3.5" /> Theme:
                        </div>
                        <select
                            value={selectedTrack}
                            onChange={(e) => setSelectedTrack(e.target.value)}
                            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                            onChange={(e) => setSortBy(e.target.value as 'SCORE_DESC' | 'SCORE_ASC' | 'NEWEST' | 'FINAL_RANK')}
                            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="FINAL_RANK">Official Final Rank</option>
                            <option value="SCORE_DESC">Technical Score (High to Low)</option>
                            <option value="SCORE_ASC">Technical Score (Low to High)</option>
                            <option value="NEWEST">Newest First</option>
                        </select>
                    </div>
                </div>

                {/* Leaderboard Table Card */}
                <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-bold text-slate-900">
                                {shortlistStatusFilter === 'FINAL_RANKING' ? 'Official Final Leaderboard' : shortlistStatusFilter === 'EVALUATED' ? 'Evaluated GitHub Repositories' : 'Ranked Repository Submissions'}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs font-semibold text-slate-500 border-slate-200 bg-white">
                                Showing {filteredSubmissions.length} of {submissions.length} teams
                            </Badge>
                        </div>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-xs text-indigo-600 hover:underline font-semibold">
                                Clear Search Filter
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="text-center py-16 text-slate-400">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                                Loading leaderboard data...
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                No submissions match your filter.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="border-b border-slate-200">
                                        <TableHead className="w-16 text-center text-xs font-bold text-slate-700">Rank</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Team &amp; GitHub Repository</TableHead>
                                        <TableHead className="hidden md:table-cell text-xs font-bold text-slate-700">Project &amp; Track</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Evaluation Status</TableHead>
                                        <TableHead className="text-center text-xs font-bold text-slate-700">Repository Score</TableHead>
                                        <TableHead className="text-right text-xs font-bold text-slate-700">Ranked Score</TableHead>
                                        <TableHead className="text-right text-xs font-bold text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.map((sub, idx) => {
                                        const codeScore = sub.githubEvaluation?.technicalScore;
                                        const isShortlisted = Boolean(sub.team?.isShortlisted);
                                        const finalRank = sub.finalRank ?? sub.team?.finalRank;
                                        const finalScore = sub.finalScore ?? sub.team?.finalScore;
                                        const isWinner = Boolean(sub.isWinner || sub.team?.isWinner);
                                        const winnerPosition = sub.winnerPosition ?? sub.team?.winnerPosition ?? (isWinner ? finalRank : undefined);
                                        const repoUrl = sub.githubEvaluation?.repoUrl || sub.team?.githubUrl;

                                        const rankDisplay = finalRank ? `#${finalRank}` : isShortlisted && sub.team?.shortlistRank ? `#${sub.team.shortlistRank}` : idx + 1;

                                        return (
                                            <TableRow key={sub._id?.toString()} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                                <TableCell className="text-center font-bold text-xs">
                                                    {winnerPosition === 1 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                                                            1
                                                        </span>
                                                    ) : winnerPosition === 2 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400 text-white text-xs font-black shadow-xs">
                                                            2
                                                        </span>
                                                    ) : winnerPosition === 3 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black shadow-xs">
                                                            3
                                                        </span>
                                                    ) : isWinner ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold">
                                                            #{finalRank}
                                                        </span>
                                                    ) : finalRank ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                            #{finalRank}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 font-semibold">{rankDisplay}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                                        {blindJudgingEnabled ? `Team #${idx + 1} (Redacted)` : (sub.team?.name || 'Unknown Team')}
                                                        {sub.aiEvaluation?.plagiarismFlag && (
                                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                                Flagged
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {repoUrl ? (
                                                        <a
                                                            href={repoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-mono mt-0.5"
                                                        >
                                                            <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="truncate max-w-[200px]">{repoUrl.replace(/^https?:\/\/github\.com\//, '')}</span>
                                                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic block mt-0.5">No repo submitted</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <p className="text-xs text-slate-800 font-semibold truncate max-w-xs">{sub.team?.projectTitle || 'Untitled Project'}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            {sub.team?.track || 'General'} Track
                                                        </span>
                                                        {sub.hackathon?.name && (
                                                            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {sub.hackathon.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {isWinner ? (
                                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-2 py-0.5 whitespace-nowrap font-bold">
                                                                {winnerPosition === 1 ? '1st Champion' : winnerPosition === 2 ? '2nd Place' : winnerPosition === 3 ? '3rd Place' : `Finalist #${finalRank}`}
                                                            </Badge>
                                                        ) : sub.githubEvaluation?.status === 'EVALUATED' ? (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 whitespace-nowrap font-semibold">
                                                                Evaluated
                                                            </Badge>
                                                        ) : sub.githubEvaluation?.status === 'ANALYZING' ? (
                                                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-2 py-0.5 whitespace-nowrap font-semibold">
                                                                <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> Analyzing
                                                            </Badge>
                                                        ) : sub.githubEvaluation?.status === 'FAILED' ? (
                                                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                                Evaluation Failed
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                                Pending Review
                                                            </Badge>
                                                        )}
                                                        {finalRank && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                Rank #{finalRank}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sub.githubEvaluation?.status === 'EVALUATED' ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="font-black text-sm text-emerald-700">
                                                                {codeScore ?? 0}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">/100</span>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setSelectedCodeReport(sub)}
                                                                title="View AI Code Audit Report"
                                                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-800"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                            </Button>
                                                        </div>
                                                    ) : sub.githubEvaluation?.status === 'ANALYZING' ? (
                                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-1 py-0 font-medium">
                                                            <Loader2 className="w-2.5 h-2.5 animate-spin mr-0.5" /> Analyzing
                                                        </Badge>
                                                    ) : sub.githubEvaluation?.status === 'FAILED' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => sub.team?._id && handleRetryCodeAnalysis(sub.team._id.toString())}
                                                            className="h-6 text-[10px] border-rose-200 text-rose-700 hover:bg-rose-50 px-2 font-bold"
                                                        >
                                                            Retry
                                                        </Button>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {finalScore !== undefined ? (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-baseline gap-0.5">
                                                                <span className="font-black text-amber-700 text-lg">{finalScore}</span>
                                                                <span className="text-[10px] text-slate-400 font-normal">/100</span>
                                                            </div>
                                                        </div>
                                                    ) : codeScore !== undefined ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-sm text-emerald-700">{codeScore}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium">Score Ready</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {sub.githubEvaluation?.status === 'EVALUATED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setSelectedCodeReport(sub)}
                                                                className="h-7 text-xs text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-semibold"
                                                            >
                                                                <Github className="w-3.5 h-3.5 mr-1" /> Audit
                                                            </Button>
                                                        )}
                                                        <Button asChild variant="outline" size="sm" className="h-7 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-xs">
                                                            <Link href={`/admin/submission/${sub._id}`}>
                                                                Report <ExternalLink className="ml-1 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </div>
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
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 text-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                                            Rank #{selectedCodeReport.team?.shortlistRank || '—'}
                                        </Badge>
                                        <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-xs">
                                            {selectedCodeReport.team?.track || 'General'} Track
                                        </Badge>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                        <Github className="w-6 h-6 text-indigo-600" />
                                        {selectedCodeReport.team?.name}
                                    </h3>
                                    {selectedCodeReport.githubEvaluation?.repoUrl && (
                                        <a
                                            href={selectedCodeReport.githubEvaluation.repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono mt-0.5"
                                        >
                                            {selectedCodeReport.githubEvaluation.repoUrl} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider">Technical Score</span>
                                        <span className="text-3xl font-black text-emerald-700 block">
                                            {selectedCodeReport.githubEvaluation?.technicalScore ?? '—'} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedCodeReport(null)}
                                        className="text-slate-400 hover:text-slate-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Rubric Breakdown */}
                            {selectedCodeReport.githubEvaluation?.breakdown && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        100-Point Technical Rubric Breakdown
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate" title="Code Quality & Maintainability">Code Quality</span>
                                            <span className="font-black text-slate-900 text-lg block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.codeQualityMaintainability ?? selectedCodeReport.githubEvaluation.breakdown.codeQuality} <span className="text-[10px] text-slate-400 font-normal">/25</span>
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate" title="Technical Implementation">Implementation</span>
                                            <span className="font-black text-slate-900 text-lg block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.technicalImplementation} <span className="text-[10px] text-slate-400 font-normal">/25</span>
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate" title="Architecture & Project Structure">Architecture</span>
                                            <span className="font-black text-slate-900 text-lg block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.architectureProjectStructure ?? selectedCodeReport.githubEvaluation.breakdown.architecture} <span className="text-[10px] text-slate-400 font-normal">/20</span>
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate" title="Testing & Error Handling">Testing &amp; Errors</span>
                                            <span className="font-black text-slate-900 text-lg block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.testingErrorHandling ?? selectedCodeReport.githubEvaluation.breakdown.documentationAndTesting} <span className="text-[10px] text-slate-400 font-normal">/15</span>
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                                            <span className="text-[11px] text-slate-500 font-semibold block truncate" title="Documentation & Development Practices">Docs &amp; Git</span>
                                            <span className="font-black text-slate-900 text-lg block mt-0.5">
                                                {selectedCodeReport.githubEvaluation.breakdown.documentationDevPractices ?? selectedCodeReport.githubEvaluation.breakdown.developmentActivity} <span className="text-[10px] text-slate-400 font-normal">/15</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            {(selectedCodeReport.githubEvaluation?.technicalSummary || selectedCodeReport.githubEvaluation?.summary) && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Executive Technical Summary
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {selectedCodeReport.githubEvaluation.technicalSummary || selectedCodeReport.githubEvaluation.summary}
                                    </p>
                                </div>
                            )}

                            {/* Detailed Feedback Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {(selectedCodeReport.githubEvaluation?.codeQualityObservations || selectedCodeReport.githubEvaluation?.codeQualityAssessment) && (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                        <h5 className="font-bold text-indigo-700 uppercase text-[11px]">Code Quality &amp; Hygiene</h5>
                                        <p className="text-slate-600 leading-relaxed">{selectedCodeReport.githubEvaluation.codeQualityObservations || selectedCodeReport.githubEvaluation.codeQualityAssessment}</p>
                                    </div>
                                )}
                                {(selectedCodeReport.githubEvaluation?.architectureObservations || selectedCodeReport.githubEvaluation?.architectureAssessment) && (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                        <h5 className="font-bold text-indigo-700 uppercase text-[11px]">System Architecture</h5>
                                        <p className="text-slate-600 leading-relaxed">{selectedCodeReport.githubEvaluation.architectureObservations || selectedCodeReport.githubEvaluation.architectureAssessment}</p>
                                    </div>
                                )}
                                {(selectedCodeReport.githubEvaluation?.testingObservations || selectedCodeReport.githubEvaluation?.testingAssessment) && (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                        <h5 className="font-bold text-indigo-700 uppercase text-[11px]">Testing &amp; Error Handling</h5>
                                        <p className="text-slate-600 leading-relaxed">{selectedCodeReport.githubEvaluation.testingObservations || selectedCodeReport.githubEvaluation.testingAssessment}</p>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.securityObservations && (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                                        <h5 className="font-bold text-amber-700 uppercase text-[11px]">Security Observations</h5>
                                        <p className="text-slate-600 leading-relaxed">{selectedCodeReport.githubEvaluation.securityObservations}</p>
                                    </div>
                                )}
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedCodeReport.githubEvaluation?.strengths && selectedCodeReport.githubEvaluation.strengths.length > 0 && (
                                    <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                                        <h5 className="text-[11px] font-bold text-emerald-800 uppercase">Key Verified Strengths</h5>
                                        <ul className="text-xs text-emerald-900 space-y-1">
                                            {selectedCodeReport.githubEvaluation.strengths.map((s, i) => (
                                                <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold">•</span> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedCodeReport.githubEvaluation?.weaknesses && selectedCodeReport.githubEvaluation.weaknesses.length > 0 && (
                                    <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-1">
                                        <h5 className="text-[11px] font-bold text-rose-800 uppercase">Technical Weaknesses &amp; Gaps</h5>
                                        <ul className="text-xs text-rose-900 space-y-1">
                                            {selectedCodeReport.githubEvaluation.weaknesses.map((w, i) => (
                                                <li key={i} className="flex items-start gap-1.5"><span className="text-rose-600 font-bold">•</span> {w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedCodeReport(null)}
                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
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
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
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

                {/* Publish Official Final Results Confirmation Modal */}
                {showPublishModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in text-slate-900">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Publish Official Final Results</h3>
                                    <p className="text-xs text-slate-500">Declare official winners and unlock leaderboard.</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-xs text-slate-600">
                                <p>
                                    You are about to declare the <strong className="text-amber-700">Top {winnerCount} Winners</strong> and publish the official final leaderboard for <strong className="text-slate-900">{activeHackathon?.name || 'this hackathon'}</strong>.
                                </p>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-slate-900 block">Official Actions:</span>
                                    <ul className="space-y-1 text-slate-600 list-disc pl-4">
                                        <li>The Top {winnerCount} ranked teams will be permanently assigned official winner podium badges.</li>
                                        <li>All participant dashboards will immediately display official final rank and podium status.</li>
                                        <li>Participant privacy masking will be turned off.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPublishModal(false)}
                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={isPublishingFinal}
                                    onClick={handlePublishFinalResults}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                                >
                                    {isPublishingFinal ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Crown className="w-3.5 h-3.5 mr-1.5" />}
                                    Confirm &amp; Publish Results
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
