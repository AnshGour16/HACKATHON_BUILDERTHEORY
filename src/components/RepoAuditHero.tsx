'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Github, Sparkles, CheckCircle2, AlertTriangle, Loader2,
    ArrowRight, ShieldCheck, Target, Code2, Layers, FileText,
    Activity, Cpu
} from 'lucide-react';

interface IEvaluationResponse {
    success: boolean;
    technicalScore?: number;
    breakdown?: {
        codeQualityMaintainability?: number;
        technicalImplementation?: number;
        architectureProjectStructure?: number;
        testingErrorHandling?: number;
        documentationDevPractices?: number;
    };
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    error?: string;
}

export default function RepoAuditHero() {
    const [githubUrl, setGithubUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<IEvaluationResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleQuickScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = githubUrl.trim();
        if (!trimmed) return;

        // Basic GitHub URL pattern check
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$/;
        if (!githubRegex.test(trimmed)) {
            setErrorMessage('Please enter a valid public GitHub URL (e.g. https://github.com/organization/project)');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setStatusMessage(null);
        setResult(null);

        try {
            const res = await fetch('/api/submit-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubUrl: trimmed })
            });

            const data = await res.json();

            if (res.status === 401) {
                // User is not signed in
                setStatusMessage('Repository format verified! To record your score on the official leaderboard, sign in or register your team.');
            } else if (!res.ok) {
                setErrorMessage(data.error || 'Failed to evaluate repository.');
            } else if (data.success) {
                setResult(data);
            }
        } catch {
            setErrorMessage('Network error during evaluation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-12">
            {/* Primary Action Card */}
            <Card className="border-primary/30 bg-neutral-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

                <CardHeader className="text-center pb-2 relative z-10">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-inner">
                        <Github className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        AI-Powered GitHub Repository Checker
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-sm max-w-xl mx-auto mt-1">
                        Submit a public GitHub repository. Gemini AI inspects documentation, architecture, code hygiene, automated tests, and git cadence to generate an objective 100-point audit.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4 relative z-10 max-w-2xl mx-auto">
                    <form onSubmit={handleQuickScan} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <label htmlFor="repoUrl" className="text-neutral-300 font-medium flex items-center gap-1.5">
                                    <Github className="w-3.5 h-3.5 text-primary" /> Public GitHub URL
                                </label>
                                <span className="text-neutral-500">Requires public access</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    id="repoUrl"
                                    type="url"
                                    placeholder="https://github.com/organization/project"
                                    value={githubUrl}
                                    onChange={(e) => {
                                        setGithubUrl(e.target.value);
                                        setErrorMessage(null);
                                        setStatusMessage(null);
                                    }}
                                    className="bg-neutral-950/80 border-neutral-700 text-white placeholder:text-neutral-500 text-sm h-11"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !githubUrl.trim()}
                                    className="bg-primary hover:bg-primary/90 text-black font-bold h-11 px-6 shrink-0 shadow-lg shadow-primary/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Auditing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" /> Audit Code
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Code Execution
                            </span>
                            <span className="flex items-center gap-1">
                                <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Deep AST & Manifest Analysis
                            </span>
                            <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-amber-400" /> 100-Point Technical Rubric
                            </span>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {statusMessage && (
                            <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs space-y-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span>{statusMessage}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Link href="/register">
                                        <Button size="sm" className="bg-primary text-black font-bold text-xs h-8">
                                            Register Team to Submit
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-200 text-xs h-8">
                                            Sign In with Existing Team
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="p-5 bg-neutral-950/90 border border-emerald-500/40 rounded-2xl space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold">
                                            Audit Complete
                                        </Badge>
                                        <span className="text-xs text-neutral-400">Technical Score</span>
                                    </div>
                                    <div className="text-2xl font-black text-emerald-400">
                                        {result.technicalScore} <span className="text-xs text-neutral-500 font-normal">/ 100</span>
                                    </div>
                                </div>

                                {result.summary && (
                                    <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                                        {result.summary}
                                    </p>
                                )}

                                <div className="flex justify-end pt-2">
                                    <Link href="/dashboard">
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                                            View Full Report on Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* 100-Point Rubric Specification Grid */}
            <div className="space-y-4">
                <div className="text-center space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Objective 100-Point Technical Rubric</h2>
                    <p className="text-xs text-neutral-400 max-w-xl mx-auto">
                        Evaluated with Gemini 2.5 Flash using actual code artifacts, dependency manifests, tests, and commit histories.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Code2 className="w-4 h-4" />
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">25 Pts</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white">Code Quality & Hygiene</h3>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                            Readability, maintainability, naming conventions, modularity, and static type safety.
                        </p>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Cpu className="w-4 h-4" />
                            </div>
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-bold">25 Pts</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white">Technical Implementation</h3>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                            Core algorithmic logic, feature depth, and practical technical execution.
                        </p>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Layers className="w-4 h-4" />
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">20 Pts</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white">Architecture & Structure</h3>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                            Clean directory layouts, separation of concerns, and dependency management.
                        </p>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <Activity className="w-4 h-4" />
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">15 Pts</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white">Testing & Error Handling</h3>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                            Automated test suites, edge case handling, and graceful error recovery.
                        </p>
                    </Card>

                    <Card className="bg-neutral-900/40 border-neutral-800/80 backdrop-blur-sm p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <FileText className="w-4 h-4" />
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold">15 Pts</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white">Documentation & Git</h3>
                        <p className="text-[11px] text-neutral-400 leading-tight">
                            Clear README setup instructions and authentic incremental commit history.
                        </p>
                    </Card>
                </div>
            </div>

            {/* Quick Links Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-xs">
                <div className="text-center sm:text-left">
                    <p className="font-semibold text-white">Are you a hackathon judge or organizer?</p>
                    <p className="text-neutral-400 mt-0.5">Access deterministic leaderboards, inspect code reports, and select winners.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-200 hover:text-white text-xs h-8">
                            Judge Login
                        </Button>
                    </Link>
                    <Link href="/submit-code">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-8">
                            Submit Team Code
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
