'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Github, Sparkles, CheckCircle2, AlertTriangle, Loader2,
    ShieldCheck, Target, Code2
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
        <div className="w-full space-y-8">
            <Card className="border border-slate-200/80 bg-white shadow-xs rounded-3xl overflow-hidden">
                <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 text-indigo-600 shadow-xs">
                        <Github className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                        AI-Powered GitHub Repository Checker
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm max-w-xl mx-auto mt-1">
                        Submit a public GitHub repository. Gemini AI inspects documentation, architecture, code hygiene, automated tests, and git cadence to generate an objective 100-point audit.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4 max-w-2xl mx-auto pb-8">
                    <form onSubmit={handleQuickScan} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <label htmlFor="repoUrl" className="text-slate-700 font-bold flex items-center gap-1.5">
                                    <Github className="w-3.5 h-3.5 text-indigo-600" /> Public GitHub URL
                                </label>
                                <span className="text-slate-400">Requires public access</span>
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
                                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm h-11 rounded-xl focus:bg-white"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !githubUrl.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shrink-0 shadow-xs"
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

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 font-medium">
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zero Code Execution
                            </span>
                            <span className="flex items-center gap-1">
                                <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Deep AST &amp; Manifest Analysis
                            </span>
                            <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-amber-600" /> 100-Point Technical Rubric
                            </span>
                        </div>
                    </form>

                    {errorMessage && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {statusMessage && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{statusMessage}</span>
                        </div>
                    )}

                    {result?.success && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-slate-500">Overall Score</span>
                                <span className="text-2xl font-black text-emerald-700">{result.technicalScore} / 100</span>
                            </div>
                            {result.summary && (
                                <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
