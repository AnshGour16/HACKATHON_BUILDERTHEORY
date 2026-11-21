'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ISubmitCodeState {
    hasTeam: boolean;
    isEligible: boolean;
    isCodePhaseOpen: boolean;
    round2Status: 'NOT_ELIGIBLE' | 'LOCKED' | 'DEADLINE_PASSED' | 'WAITING_FOR_SUBMISSION' | 'ANALYZING' | 'EVALUATED' | 'FAILED';
    team?: {
        _id: string;
        name: string;
        track: string;
        isShortlisted: boolean;
        shortlistRank?: number;
        githubUrl?: string;
    };
    hackathon?: {
        name?: string;
        isCodeSubmissionOpen?: boolean;
    };
    githubEvaluation?: {
        status: string;
        technicalScore?: number;
        repoUrl?: string;
        error?: string;
    };
}

export default function SubmitCodePage() {
    const [pageState, setPageState] = useState<ISubmitCodeState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [githubUrl, setGithubUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/submit-code');
            const data = await res.json();

            if (res.status === 401) {
                setError('Unauthorized. Please log in with your team leader account.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                setError(data.error || 'Failed to check Round 2 status.');
                setLoading(false);
                return;
            }

            setPageState(data);
            if (data.team?.githubUrl) {
                setGithubUrl(data.team.githubUrl);
            }
        } catch {
            setError('Network error while checking Round 2 portal.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!githubUrl.trim()) return;

        setIsSubmitting(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/submit-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubUrl })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                setMessage('Repository successfully evaluated!');
                fetchStatus();
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to submit repository.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-neutral-400">Verifying Round 2 eligibility...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                <Card className="w-full max-w-md shadow-2xl border-red-500/20 bg-background/60 backdrop-blur-xl text-center p-6 space-y-4">
                    <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
                    <CardTitle className="text-xl font-bold text-white">Authentication Required</CardTitle>
                    <CardDescription className="text-neutral-400 text-sm">
                        {error}
                    </CardDescription>
                    <div className="flex gap-2 justify-center">
                        <Button asChild className="bg-primary text-black font-semibold">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">Home</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!pageState?.hasTeam) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/60 backdrop-blur-xl text-center p-6 space-y-4">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                    <CardTitle className="text-xl font-bold text-white">No Team Registered</CardTitle>
                    <CardDescription className="text-neutral-400 text-sm">
                        You do not currently lead a registered team. Please register your team first to participate in the hackathon.
                    </CardDescription>
                    <Button asChild className="bg-primary text-black font-semibold">
                        <Link href="/register">Register Team</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    if (pageState.round2Status === 'LOCKED') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                <Card className="w-full max-w-md shadow-2xl border-amber-500/20 bg-background/60 backdrop-blur-xl text-center p-6 space-y-4">
                    <div className="mx-auto bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Code Submission Locked</CardTitle>
                    <CardDescription className="text-neutral-400 text-sm leading-relaxed">
                        Repository submission for Team <strong>&ldquo;{pageState.team?.name}&rdquo;</strong> is currently locked. The hackathon organizers have not opened repository submissions yet.
                    </CardDescription>
                    <Button asChild variant="outline" className="border-neutral-800 text-neutral-300 w-full">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

            <Card className="w-full max-w-lg shadow-2xl border-primary/20 bg-background/60 backdrop-blur-xl relative z-10">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <Github className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready for Code Evaluation
                        </Badge>
                        <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-xs">
                            {pageState.team?.track || 'General'} Track
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        Submit Repository: {pageState.team?.name}
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">
                        Submit your public GitHub repository for automated code quality, architecture, testing, and security evaluation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pageState.githubEvaluation?.status === 'EVALUATED' && (
                        <div className="p-4 mb-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="text-xs text-indigo-300 font-semibold uppercase">Latest Technical Score</span>
                                <p className="text-2xl font-extrabold text-white">
                                    {pageState.githubEvaluation.technicalScore} <span className="text-xs text-neutral-500 font-normal">/ 100</span>
                                </p>
                            </div>
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                                <Link href="/dashboard">View Full Scorecard</Link>
                            </Button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2 flex flex-col">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="githubUrl" className="text-white text-sm">Public GitHub Repository URL</Label>
                                <span className="text-[11px] text-neutral-400">Must be public</span>
                            </div>
                            <Input
                                id="githubUrl"
                                type="url"
                                placeholder="https://github.com/organization/project"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="bg-neutral-900/50 border-neutral-800 text-white"
                                required
                            />
                            <p className="text-[11px] text-neutral-400 leading-tight">
                                💡 Our engine analyzes README documentation, dependency manifests (e.g. <code>package.json</code>), source files, test suites, and authentic commit cadence.
                            </p>
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-red-900/30 border border-red-900/50 rounded-md text-red-200 text-xs text-center flex items-center gap-2 justify-center">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                                <span>{message}</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="p-3 bg-green-900/30 border border-green-900/50 rounded-md text-green-200 text-xs text-center flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{message}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-primary text-black font-semibold" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating Codebase...</>
                            ) : pageState.githubEvaluation?.status === 'EVALUATED' ? (
                                'Re-Evaluate Updated Repository'
                            ) : (
                                'Submit Code for AI Audit'
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <Link href="/dashboard" className="text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
