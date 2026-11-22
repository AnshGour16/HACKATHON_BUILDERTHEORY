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

    if (loading) return <div className="min-h-screen bg-slate-50 flex justify-center items-center text-slate-600 font-medium">Loading evaluation details...</div>;
    if (!data) return <div className="min-h-screen bg-slate-50 flex justify-center items-center text-slate-600 font-medium">Submission not found.</div>;

    const gh = data.githubEvaluation;
    const repoScore = gh?.technicalScore ?? data.team?.githubScore ?? 0;
    const repoUrl = gh?.repoUrl || data.team?.githubUrl;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Profile */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button asChild variant="outline" size="icon" className="shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs">
                            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                    {blindMode ? 'Team Redacted (Blind Mode)' : (data.team?.name || 'Unknown Team')}
                                </h1>
                                <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-semibold">
                                    {data.team?.track || 'General'} Track
                                </Badge>
                                {data.hackathon && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                        {data.hackathon.name}
                                    </Badge>
                                )}
                                {gh?.status === 'EVALUATED' && (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Evaluated
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm mt-1">{data.team?.problemStatement || 'No Problem Statement'}</p>

                            {repoUrl && !blindMode && (
                                <div className="mt-2">
                                    <a
                                        href={repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-mono"
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
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
                        <div className="flex flex-col items-center bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Repository Score</span>
                            <span className="text-3xl font-black text-slate-900">
                                {repoScore}
                                <span className="text-xs text-slate-400 font-normal"> / 100</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 100-Point Rubric Score Breakdown */}
                {gh?.breakdown && (
                    <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                                <Target className="w-4 h-4 text-indigo-600" /> 100-Point Technical Rubric Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                                    <span className="text-[11px] text-slate-500 font-semibold block truncate">Code Quality</span>
                                    <span className="font-black text-slate-900 text-lg block mt-0.5">
                                        {gh.breakdown.codeQualityMaintainability ?? gh.breakdown.codeQuality} <span className="text-xs text-slate-400 font-normal">/ 25</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                                    <span className="text-[11px] text-slate-500 font-semibold block truncate">Implementation</span>
                                    <span className="font-black text-slate-900 text-lg block mt-0.5">
                                        {gh.breakdown.technicalImplementation} <span className="text-xs text-slate-400 font-normal">/ 25</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                                    <span className="text-[11px] text-slate-500 font-semibold block truncate">Architecture</span>
                                    <span className="font-black text-slate-900 text-lg block mt-0.5">
                                        {gh.breakdown.architectureProjectStructure ?? gh.breakdown.architecture} <span className="text-xs text-slate-400 font-normal">/ 20</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                                    <span className="text-[11px] text-slate-500 font-semibold block truncate">Testing &amp; Errors</span>
                                    <span className="font-black text-slate-900 text-lg block mt-0.5">
                                        {gh.breakdown.testingErrorHandling ?? gh.breakdown.documentationAndTesting} <span className="text-xs text-slate-400 font-normal">/ 15</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                                    <span className="text-[11px] text-slate-500 font-semibold block truncate">Docs &amp; Git</span>
                                    <span className="font-black text-slate-900 text-lg block mt-0.5">
                                        {gh.breakdown.documentationDevPractices ?? gh.breakdown.developmentActivity} <span className="text-xs text-slate-400 font-normal">/ 15</span>
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* AI Executive Summary Card */}
                {gh?.summary && (
                    <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="flex items-center gap-2 text-base text-slate-900 font-bold">
                                <Brain className="w-4 h-4 text-indigo-600" /> Technical Executive Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="leading-relaxed text-slate-700 text-sm">
                                {gh.summary}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Observations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(gh?.architectureObservations || gh?.architectureAssessment) && (
                        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Architecture &amp; Project Modularity
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {gh.architectureObservations || gh.architectureAssessment}
                            </p>
                        </Card>
                    )}

                    {(gh?.codeQualityObservations || gh?.codeQualityAssessment) && (
                        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Code Quality &amp; Maintainability
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {gh.codeQualityObservations || gh.codeQualityAssessment}
                            </p>
                        </Card>
                    )}

                    {(gh?.testingObservations || gh?.testingAssessment) && (
                        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-indigo-600" /> Testing &amp; Error Handling Evidence
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {gh.testingObservations || gh.testingAssessment}
                            </p>
                        </Card>
                    )}

                    {gh?.securityObservations && (
                        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Security &amp; Static Safety
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {gh.securityObservations}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gh?.strengths && gh.strengths.length > 0 && (
                        <Card className="border border-emerald-200 bg-emerald-50/70 shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Technical Strengths
                            </h4>
                            <ul className="space-y-1.5">
                                {gh.strengths.map((str, i) => (
                                    <li key={i} className="text-xs text-emerald-950 flex items-start gap-2">
                                        <span className="text-emerald-600 font-bold">•</span> {str}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {gh?.weaknesses && gh.weaknesses.length > 0 && (
                        <Card className="border border-rose-200 bg-rose-50/70 shadow-xs rounded-2xl p-5 space-y-2">
                            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Technical Weaknesses &amp; Gaps
                            </h4>
                            <ul className="space-y-1.5">
                                {gh.weaknesses.map((w, i) => (
                                    <li key={i} className="text-xs text-rose-950 flex items-start gap-2">
                                        <span className="text-rose-600 font-bold">•</span> {w}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>

                {/* Improvement Recommendations */}
                {gh?.improvementRecommendations && gh.improvementRecommendations.length > 0 && (
                    <Card className="border border-indigo-200 bg-indigo-50/60 shadow-xs rounded-2xl p-5 space-y-2">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-indigo-600" /> Actionable Recommendations
                        </h4>
                        <ul className="space-y-1.5">
                            {gh.improvementRecommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-indigo-950 flex items-start gap-2">
                                    <span className="text-indigo-600 font-bold">→</span> {rec}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {/* Transparent Files Inspected */}
                {gh?.filesInspected && gh.filesInspected.length > 0 && (
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl text-xs space-y-2 shadow-xs">
                        <span className="text-xs font-bold text-slate-700 block">
                            Files Inspected during Static Code Audit ({gh.filesInspected.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {gh.filesInspected.map((file, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
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
