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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500 font-medium">Verifying Round 2 eligibility...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <Card className="w-full max-w-md shadow-xs border border-rose-200 bg-white text-center p-6 space-y-4 rounded-3xl">
                    <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
                    <CardTitle className="text-xl font-bold text-slate-900">Authentication Required</CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                        {error}
                    </CardDescription>
                    <div className="flex gap-2 justify-center">
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                            <Link href="/">Home</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!pageState?.hasTeam) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <Card className="w-full max-w-md shadow-xs border border-slate-200 bg-white text-center p-6 space-y-4 rounded-3xl">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <CardTitle className="text-xl font-bold text-slate-900">No Team Registered</CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                        You do not currently lead a registered team. Please register your team first to participate in the hackathon.
                    </CardDescription>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs">
                        <Link href="/register">Register Team</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    if (pageState.round2Status === 'LOCKED') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <Card className="w-full max-w-md shadow-xs border border-amber-200 bg-white text-center p-6 space-y-4 rounded-3xl">
                    <div className="mx-auto bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center border border-amber-200">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Code Submission Locked</CardTitle>
                    <CardDescription className="text-slate-500 text-sm leading-relaxed">
                        Repository submission for Team <strong>&ldquo;{pageState.team?.name}&rdquo;</strong> is currently locked. The hackathon organizers have not opened repository submissions yet.
                    </CardDescription>
                    <Button asChild variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full shadow-xs font-semibold">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-lg shadow-sm border border-slate-200/80 bg-white rounded-3xl p-6 space-y-6 text-slate-900">
                <CardHeader className="text-center p-0 space-y-2">
                    <div className="mx-auto bg-indigo-50 border border-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-1">
                        <Github className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready for Code Evaluation
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 text-xs">
                            {pageState.team?.track || 'General'} Track
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
                        Submit Repository: {pageState.team?.name}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">
                        Submit your public GitHub repository for automated code quality, architecture, testing, and security evaluation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {pageState.githubEvaluation?.status === 'EVALUATED' && (
                        <div className="p-4 mb-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-xs text-indigo-800 font-bold uppercase tracking-wider">Latest Technical Score</span>
                                <p className="text-2xl font-black text-slate-900">
                                    {pageState.githubEvaluation.technicalScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                                </p>
                            </div>
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs">
                                <Link href="/dashboard">View Full Scorecard</Link>
                            </Button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2 flex flex-col">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="githubUrl" className="text-slate-900 font-bold text-xs">Public GitHub Repository URL</Label>
                                <span className="text-[11px] text-slate-400">Must be public</span>
                            </div>
                            <Input
                                id="githubUrl"
                                type="url"
                                placeholder="https://github.com/organization/project"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                                required
                            />
                            <p className="text-[11px] text-slate-500 leading-tight">
                                Our engine analyzes README documentation, dependency manifests (e.g. <code>package.json</code>), source files, test suites, and authentic commit cadence.
                            </p>
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-center flex items-center gap-2 justify-center font-medium">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                                <span>{message}</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-center flex items-center justify-center gap-2 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>{message}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs h-10" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating Codebase...</>
                            ) : pageState.githubEvaluation?.status === 'EVALUATED' ? (
                                'Re-Evaluate Updated Repository'
                            ) : (
                                'Submit Code for AI Audit'
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center justify-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
