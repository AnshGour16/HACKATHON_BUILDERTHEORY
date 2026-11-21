import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles, Briefcase, Users, ShieldCheck, ArrowRight,
    Github, FileText, CheckCircle2, Trophy, BarChart3,
    Terminal, Layers, Brain, Search, Clock
} from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen font-sans relative overflow-hidden pb-20">
            {/* Dynamic Background Effects */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none" />

            <main className="container mx-auto px-4 py-12 md:py-20 relative z-10 max-w-6xl">
                {/* Hero Header */}
                <div className="flex flex-col items-center mb-16 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs md:text-sm font-semibold text-primary shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>All-Industry AI Hiring & Talent Intelligence Platform</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.1]">
                        Evaluate What Candidates <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-indigo-400">
                            Can Actually Demonstrate
                        </span>
                    </h1>

                    <p className="max-w-3xl text-neutral-400 text-base md:text-xl leading-relaxed">
                        Go beyond resume claims. HireSphere evaluates real capability across 8 major industries — from static GitHub codebase analysis for engineers to verified case study audits for sales, marketing, finance, HR, and design.
                    </p>

                    {/* Dual Persona Call to Actions */}
                    <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
                        <Link href="/recruiter">
                            <Button className="bg-primary hover:bg-primary/90 text-black font-extrabold text-sm h-12 px-8 shadow-xl shadow-primary/25 rounded-xl">
                                <Briefcase className="w-4 h-4 mr-2" />
                                Recruiter Portal & Pipeline
                            </Button>
                        </Link>
                        <Link href="/jobs">
                            <Button variant="outline" className="border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-white font-bold text-sm h-12 px-8 rounded-xl backdrop-blur-sm">
                                <Search className="w-4 h-4 mr-2 text-primary" />
                                Candidate Job Board
                            </Button>
                        </Link>
                        <Link href="/candidate/profile">
                            <Button variant="ghost" className="text-neutral-300 hover:text-white text-sm h-12 px-5">
                                Upload Resume (AI Parser) <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-neutral-500 pt-2">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Explainable AI Rubrics
                        </span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Zero Code Execution
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-emerald-400" /> Interactive Recruiter Copilot
                        </span>
                    </div>
                </div>

                {/* 3 Core System Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {/* Pillar 1: Recruiter Command Center */}
                    <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all duration-200">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Recruiter Intelligence & Pipeline</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Complete hiring workflow with 5-stage Kanban board, objective candidate match scores (95%, 89%), radial scorecards, and floating AI Copilot to schedule interviews.
                            </p>
                        </div>
                        <div className="pt-6 border-t border-neutral-800/80 mt-6 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-primary">YouKT / HireSphere Suite</span>
                            <Link href="/recruiter" className="text-xs text-neutral-300 hover:text-white font-medium inline-flex items-center">
                                Open Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Pillar 2: Candidate Practical Demonstration */}
                    <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-200">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Evidence-Based Demonstrations</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                PDF resume extraction, role-specific practical tasks, and static GitHub audits. Candidates demonstrate real competency through verified code or industry solutions.
                            </p>
                        </div>
                        <div className="pt-6 border-t border-neutral-800/80 mt-6 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-indigo-400">8 Industry Categories</span>
                            <Link href="/jobs" className="text-xs text-neutral-300 hover:text-white font-medium inline-flex items-center">
                                Explore Jobs <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Pillar 3: Hackathon Technical Checker */}
                    <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-all duration-200">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Hackathon Codebase Ranking</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Automated GitHub code review against 100-point rubric, commit history inspection, and server-side deterministic leaderboards for hackathon judges.
                            </p>
                        </div>
                        <div className="pt-6 border-t border-neutral-800/80 mt-6 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-amber-400">Judge & Team System</span>
                            <Link href="/admin" className="text-xs text-neutral-300 hover:text-white font-medium inline-flex items-center">
                                Judge Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 8 Industry Verticals Grid */}
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 md:p-12 mb-16 backdrop-blur-md">
                    <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                            Tailored Evaluation Across Every Major Profession
                        </h2>
                        <p className="text-xs md:text-sm text-neutral-400">
                            We don&apos;t apply one-size-fits-all tests. Each discipline is evaluated using evidence relevant to real-world performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                <Github className="w-4 h-4" /> Software & IT
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                GitHub repo AST inspection, architectural modularity, test suites, and git cadence.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">GitHub Code Audit</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <Users className="w-4 h-4" /> Sales & BD
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Enterprise cold outreach, pitch persuasion, objection handling & pipeline execution.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">Case Study Audit</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                                <Sparkles className="w-4 h-4" /> Marketing
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                90-day multi-channel inbound strategy, creative copy, CAC payback & analytics.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">Campaign Assignment</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                <BarChart3 className="w-4 h-4" /> Finance & Accounting
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Unit economics, SaaS burn multiple, financial rigor, and statutory compliance.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">Financial Modeling</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                <Briefcase className="w-4 h-4" /> Human Resources
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Talent sourcing strategies, remote onboarding workflows, and labor policy.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">People Ops Scenario</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                                <Layers className="w-4 h-4" /> Operations
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                SOP design, supply chain bottleneck reduction, resource allocation & budgeting.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">Process Simulation</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                                <Clock className="w-4 h-4" /> Customer Support
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                De-escalation scripts, customer empathy, resolution speed & KB documentation.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">Escalation Playbook</Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                                <Terminal className="w-4 h-4" /> Design & Creative
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Mobile-first checkout flow, design system coherence, and information architecture.
                            </p>
                            <Badge variant="outline" className="text-[10px] border-neutral-800 text-neutral-400">UX Architecture</Badge>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-2xl bg-gradient-to-r from-neutral-900 to-indigo-950/30 border border-neutral-800 flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Are you hiring talent?</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                                Post open jobs with customizable 100-point rubrics, view candidates sorted by AI match score, and use Recruiter Copilot to advance applicants through your hiring pipeline.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button asChild className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10 px-5">
                                <Link href="/recruiter">Open Recruiter Suite</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-neutral-700 text-xs h-10 text-neutral-300">
                                <Link href="/recruiter/jobs/new">Post a Vacancy</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl bg-gradient-to-r from-neutral-900 to-emerald-950/30 border border-neutral-800 flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Looking for your next opportunity?</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                                Upload your PDF resume to have Gemini AI automatically extract your skills, explore verified roles across 8 verticals, and receive transparent evaluation scorecards.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 px-5">
                                <Link href="/jobs">Browse Open Roles</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-neutral-700 text-xs h-10 text-neutral-300">
                                <Link href="/candidate/profile">Upload PDF Resume</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
