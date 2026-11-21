'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Brain, Target, AlertTriangle, CheckCircle2,
    Download, Github, ShieldCheck, Code2, Layers, Activity,
    ExternalLink, Wrench
} from 'lucide-react';
import Link from 'next/link';
import { generateFeedbackPDF } from '@/lib/pdf-generator';
import { ISubmission } from '@/models/Submission';
import { ITeam } from '@/models/Team';

// Create a UI specific interface since the API populates the team object
interface ISubmissionWithTeam extends Omit<ISubmission, 'team' | 'hackathon'> {
    team: ITeam;
    hackathon?: { _id: string; name: string; theme: string };
}

export default function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [data, setData] = useState<ISubmissionWithTeam | null>(null);
    const [loading, setLoading] = useState(true);
    const [blindMode, setBlindMode] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const json = await res.json();
                if (json.success) setBlindMode(json.blindJudgingEnabled);
            } catch (e) {
                console.error(e);
            }
        };
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/submissions/${unwrappedParams.id}`);
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        fetchDetail();
    }, [unwrappedParams.id]);

    if (loading) return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-white">Loading evaluation details...</div>;
    if (!data) return <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-white">Submission not found.</div>;

    const gh = data.githubEvaluation;
    const repoScore = gh?.technicalScore ?? data.team?.githubScore ?? 0;
    const repoUrl = gh?.repoUrl || data.team?.githubUrl;

    return (
        <div className="min-h-screen p-8 relative">
            <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                {/* Header Profile */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button asChild variant="outline" size="icon" className="shrink-0">
                            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    {blindMode ? 'Team Redacted (Blind Mode)' : (data.team?.name || 'Unknown Team')}
                                </h1>
                                <Badge variant="outline" className="border-indigo-500/50 text-indigo-300">
                                    {data.team?.track || 'General'} Track
                                </Badge>
                                {data.hackathon && (
                                    <Badge variant="secondary" className="bg-purple-950/60 text-purple-300 border border-purple-500/30">
                                        {data.hackathon.name}
                                    </Badge>
                                )}
                                {gh?.status === 'EVALUATED' && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Evaluated
                                    </Badge>
                                )}
                            </div>
                            <p className="text-neutral-400 text-sm mt-1">{data.team?.problemStatement || 'No Problem Statement'}</p>

                            {repoUrl && !blindMode && (
                                <div className="mt-2">
                                    <a
                                        href={repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-mono"
                                    >
                                        <Github className="w-4 h-4 mr-1.5" />
                                        {repoUrl.replace(/^https?:\/\/github\.com\//, '')}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <Button
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                            onClick={() => {
                                const exportTeam = blindMode
                                    ? { ...(data.team as unknown as Record<string, unknown>), name: 'Team Redacted (Blind Mode)' }
                                    : (data.team as unknown as Record<string, unknown>);
                                generateFeedbackPDF(exportTeam, (data.aiEvaluation || {}) as unknown as Record<string, unknown>);
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                        <div className="flex flex-col items-center bg-primary/10 border border-primary/30 px-5 py-2.5 rounded-xl">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Repository Score</span>
                            <span className="text-3xl font-extrabold text-white">
                                {repoScore}
                                <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 100-Point Rubric Score Breakdown */}
                {gh?.breakdown && (
                    <Card className="border-indigo-500/30 bg-neutral-900/60 backdrop-blur-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                                <Target className="w-4 h-4 text-indigo-400" /> 100-Point Technical Rubric Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 text-center">
                                    <span className="text-[11px] text-neutral-400 block truncate">Code Quality</span>
                                    <span className="font-bold text-white text-lg block mt-0.5">
                                        {gh.breakdown.codeQualityMaintainability ?? gh.breakdown.codeQuality} <span className="text-xs text-neutral-500 font-normal">/ 25</span>
                                    </span>
                                </div>
                                <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 text-center">
                                    <span className="text-[11px] text-neutral-400 block truncate">Implementation</span>
                                    <span className="font-bold text-white text-lg block mt-0.5">
                                        {gh.breakdown.technicalImplementation} <span className="text-xs text-neutral-500 font-normal">/ 25</span>
                                    </span>
                                </div>
                                <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 text-center">
                                    <span className="text-[11px] text-neutral-400 block truncate">Architecture</span>
                                    <span className="font-bold text-white text-lg block mt-0.5">
                                        {gh.breakdown.architectureProjectStructure ?? gh.breakdown.architecture} <span className="text-xs text-neutral-500 font-normal">/ 20</span>
                                    </span>
                                </div>
                                <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 text-center">
                                    <span className="text-[11px] text-neutral-400 block truncate">Testing & Errors</span>
                                    <span className="font-bold text-white text-lg block mt-0.5">
                                        {gh.breakdown.testingErrorHandling ?? gh.breakdown.documentationAndTesting} <span className="text-xs text-neutral-500 font-normal">/ 15</span>
                                    </span>
                                </div>
                                <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 text-center">
                                    <span className="text-[11px] text-neutral-400 block truncate">Documentation & Git</span>
                                    <span className="font-bold text-white text-lg block mt-0.5">
                                        {gh.breakdown.documentationDevPractices ?? gh.breakdown.developmentActivity} <span className="text-xs text-neutral-500 font-normal">/ 15</span>
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* AI Executive Summary Card */}
                {gh?.summary && (
                    <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-white">
                                <Brain className="w-4 h-4 text-primary" /> Technical Executive Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed text-neutral-300 text-sm">
                                {gh.summary}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Observations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(gh?.architectureObservations || gh?.architectureAssessment) && (
                        <Card className="border-neutral-800 bg-neutral-900/40 p-4 space-y-1.5">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Architecture & Project Modularity
                            </h4>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                {gh.architectureObservations || gh.architectureAssessment}
                            </p>
                        </Card>
                    )}

                    {(gh?.codeQualityObservations || gh?.codeQualityAssessment) && (
                        <Card className="border-neutral-800 bg-neutral-900/40 p-4 space-y-1.5">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5" /> Code Quality & Maintainability
                            </h4>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                {gh.codeQualityObservations || gh.codeQualityAssessment}
                            </p>
                        </Card>
                    )}

                    {(gh?.testingObservations || gh?.testingAssessment) && (
                        <Card className="border-neutral-800 bg-neutral-900/40 p-4 space-y-1.5">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" /> Testing & Error Handling Evidence
                            </h4>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                {gh.testingObservations || gh.testingAssessment}
                            </p>
                        </Card>
                    )}

                    {gh?.securityObservations && (
                        <Card className="border-neutral-800 bg-neutral-900/40 p-4 space-y-1.5">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> Security & Static Safety
                            </h4>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                                {gh.securityObservations}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gh?.strengths && gh.strengths.length > 0 && (
                        <Card className="border-emerald-500/20 bg-emerald-950/10 p-5 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Technical Strengths
                            </h4>
                            <ul className="space-y-1.5">
                                {gh.strengths.map((str, i) => (
                                    <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                        <span className="text-emerald-400">•</span> {str}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {gh?.weaknesses && gh.weaknesses.length > 0 && (
                        <Card className="border-red-500/20 bg-red-950/10 p-5 space-y-2">
                            <h4 className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Technical Weaknesses & Gaps
                            </h4>
                            <ul className="space-y-1.5">
                                {gh.weaknesses.map((w, i) => (
                                    <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                        <span className="text-red-400">•</span> {w}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>

                {/* Improvement Recommendations */}
                {gh?.improvementRecommendations && gh.improvementRecommendations.length > 0 && (
                    <Card className="border-indigo-500/20 bg-indigo-950/10 p-5 space-y-2">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-indigo-400" /> Actionable Recommendations
                        </h4>
                        <ul className="space-y-1.5">
                            {gh.improvementRecommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                                    <span className="text-indigo-400">→</span> {rec}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {/* Transparent Files Inspected */}
                {gh?.filesInspected && gh.filesInspected.length > 0 && (
                    <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl text-xs space-y-2">
                        <span className="text-xs font-semibold text-neutral-400 block">
                            Files Inspected during Static Code Audit ({gh.filesInspected.length})
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
            </div>
        </div>
    );
}
