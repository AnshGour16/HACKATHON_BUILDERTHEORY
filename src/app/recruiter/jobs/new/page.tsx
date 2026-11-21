'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Briefcase, Plus, Trash2, ArrowLeft, ArrowRight,
    Sparkles, Target, Github, FileText, CheckCircle2, Loader2
} from 'lucide-react';

interface IRubricItem {
    name: string;
    weight: number;
    description?: string;
}

const DEPARTMENT_RUBRICS: Record<string, { type: 'TECHNICAL_GITHUB' | 'NON_TECHNICAL_ASSIGNMENT' | 'RESUME_ONLY'; rubric: IRubricItem[]; defaultAssignment?: string }> = {
    'Software & IT': {
        type: 'TECHNICAL_GITHUB',
        rubric: [
            { name: 'Code Quality and Maintainability', weight: 25 },
            { name: 'Technical Implementation & Logic', weight: 25 },
            { name: 'Architecture and Modularity', weight: 20 },
            { name: 'Testing and Error Handling', weight: 15 },
            { name: 'Documentation and Git Best Practices', weight: 15 }
        ]
    },
    'Sales & Business Development': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Submit an executive pitch and cold outbound email strategy for enterprise clients selling a $50k/yr B2B SaaS solution.',
        rubric: [
            { name: 'Value Proposition & Persuasion', weight: 30 },
            { name: 'Prospecting & Pipeline Execution', weight: 25 },
            { name: 'Objection Handling & Negotiation', weight: 25 },
            { name: 'Sales Metric Orientation & Experience', weight: 20 }
        ]
    },
    'Marketing': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Develop a 90-day comprehensive inbound growth strategy for a new developer tool, including paid acquisition, SEO content clusters, and viral loops.',
        rubric: [
            { name: 'Campaign Strategy & Targeting', weight: 30 },
            { name: 'Creative Messaging & Copywriting', weight: 25 },
            { name: 'Data & Performance Analytics', weight: 25 },
            { name: 'Multi-Channel Execution Tactics', weight: 20 }
        ]
    },
    'Finance & Accounting': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Prepare an analysis framework for evaluating unit economics, CAC payback period, and SaaS burn multiple for a Series A startup.',
        rubric: [
            { name: 'Financial Modeling & Quantitative Rigor', weight: 30 },
            { name: 'Regulatory Compliance & Accuracy', weight: 25 },
            { name: 'Forecasting & Risk Mitigation', weight: 25 },
            { name: 'Strategic Decision Framework', weight: 20 }
        ]
    },
    'Human Resources': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Design a high-retention onboarding workflow and talent acquisition screening process for a 50-person fast-scaling remote organization.',
        rubric: [
            { name: 'Talent Acquisition & Sourcing Strategy', weight: 30 },
            { name: 'Employee Engagement & Culture', weight: 25 },
            { name: 'HR Policies & Labor Compliance', weight: 25 },
            { name: 'Conflict Resolution & People Ops', weight: 20 }
        ]
    },
    'Operations': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Propose an end-to-end supply chain optimization or process standard operating procedure (SOP) reducing fulfillment bottlenecks by 30%.',
        rubric: [
            { name: 'Process Optimization & Efficiency', weight: 30 },
            { name: 'Resource Allocation & Budgeting', weight: 25 },
            { name: 'Cross-Functional Coordination', weight: 25 },
            { name: 'Problem-Solving & Crisis Mitigation', weight: 20 }
        ]
    },
    'Customer Support': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Draft sample response playbooks for 3 high-escalation tier-1 customer dispute cases involving billing errors and service downtime.',
        rubric: [
            { name: 'Empathy & Customer-Centric Communication', weight: 35 },
            { name: 'De-escalation & Conflict Resolution', weight: 30 },
            { name: 'Technical Troubleshooting Speed', weight: 20 },
            { name: 'Documentation & Knowledge Base Hygiene', weight: 15 }
        ]
    },
    'Design & Creative': {
        type: 'NON_TECHNICAL_ASSIGNMENT',
        defaultAssignment: 'Provide a design rationale and wireframe walkthrough for a mobile-first checkout flow with minimal friction and maximum conversion.',
        rubric: [
            { name: 'Visual Hierarchy & Aesthetic Quality', weight: 30 },
            { name: 'User Experience & Information Architecture', weight: 30 },
            { name: 'Design System & Component Consistency', weight: 20 },
            { name: 'User Empathy & Research Grounding', weight: 20 }
        ]
    }
};

export default function NewJobPage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [companyName, setCompanyName] = useState('HireSphere Partner');
    const [department, setDepartment] = useState('Software & IT');
    const [location, setLocation] = useState('Remote / Hybrid');
    const [jobType, setJobType] = useState('Full-time');
    const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
    const [minSalary, setMinSalary] = useState('110000');
    const [maxSalary, setMaxSalary] = useState('150000');
    const [currency, setCurrency] = useState('USD');
    const [description, setDescription] = useState('');
    const [skillsInput, setSkillsInput] = useState('React, TypeScript, Node.js, Next.js, PostgreSQL');
    const [responsibilitiesInput, setResponsibilitiesInput] = useState('Design and build resilient full-stack web applications\nCollaborate with product designers and backend engineers\nMaintain rigorous test coverage and continuous integration pipelines');
    const [requirementsInput, setRequirementsInput] = useState('3+ years of professional software engineering experience\nStrong proficiency with TypeScript and modern web frameworks\nDemonstrated ability to produce clean, well-tested code');

    // Evaluation Configuration
    const [evaluationType, setEvaluationType] = useState<'TECHNICAL_GITHUB' | 'NON_TECHNICAL_ASSIGNMENT' | 'RESUME_ONLY'>('TECHNICAL_GITHUB');
    const [assignmentBrief, setAssignmentBrief] = useState('');
    const [rubric, setRubric] = useState<IRubricItem[]>(DEPARTMENT_RUBRICS['Software & IT'].rubric);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDepartmentChange = (newDept: string) => {
        setDepartment(newDept);
        const config = DEPARTMENT_RUBRICS[newDept];
        if (config) {
            setEvaluationType(config.type);
            setRubric(config.rubric);
            if (config.defaultAssignment) {
                setAssignmentBrief(config.defaultAssignment);
            } else {
                setAssignmentBrief('');
            }
        }
    };

    const updateRubricItem = (idx: number, field: keyof IRubricItem, val: string | number) => {
        const updated = [...rubric];
        updated[idx] = { ...updated[idx], [field]: val };
        setRubric(updated);
    };

    const addRubricItem = () => {
        setRubric([...rubric, { name: 'New Evaluation Criterion', weight: 10 }]);
    };

    const removeRubricItem = (idx: number) => {
        if (rubric.length <= 1) return;
        setRubric(rubric.filter((_, i) => i !== idx));
    };

    const totalWeight = rubric.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (totalWeight !== 100) {
            setError(`Evaluation rubric weights must sum to exactly 100 points (current total: ${totalWeight}).`);
            return;
        }

        setIsSubmitting(true);

        const requiredSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
        const responsibilities = responsibilitiesInput.split('\n').map(s => s.trim()).filter(Boolean);
        const requirements = requirementsInput.split('\n').map(s => s.trim()).filter(Boolean);

        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    companyName,
                    department,
                    location,
                    jobType,
                    experienceLevel,
                    salaryRange: {
                        min: minSalary ? Number(minSalary) : undefined,
                        max: maxSalary ? Number(maxSalary) : undefined,
                        currency
                    },
                    description,
                    requiredSkills,
                    responsibilities,
                    requirements,
                    evaluationType,
                    assignmentBrief: evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? assignmentBrief : undefined,
                    evaluationRubric: rubric
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Failed to post vacancy.');
                setIsSubmitting(false);
                return;
            }

            router.push('/recruiter');
            router.refresh();
        } catch (err) {
            console.error(err);
            setError('A network error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pb-16 px-4 md:px-8 max-w-4xl mx-auto pt-6">
            <Link
                href="/recruiter"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Recruiter Dashboard
            </Link>

            <div className="space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
                        <Briefcase className="w-3.5 h-3.5" />
                        Role-Specific AI Calibration
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Create New Job Opening</h1>
                    <p className="text-neutral-400 text-sm mt-1">
                        Define job parameters and configure the exact 100-point AI evaluation rubric used to score candidates.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Job Details */}
                    <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-white">1. Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobTitle" className="text-xs text-neutral-300">Job Title *</Label>
                                    <Input
                                        id="newJobTitle"
                                        required
                                        placeholder="e.g. Senior Full-Stack Engineer"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobCompany" className="text-xs text-neutral-300">Hiring Company *</Label>
                                    <Input
                                        id="newJobCompany"
                                        required
                                        placeholder="e.g. Acme Tech Corp"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobDept" className="text-xs text-neutral-300">Industry / Department *</Label>
                                    <select
                                        id="newJobDept"
                                        value={department}
                                        onChange={(e) => handleDepartmentChange(e.target.value)}
                                        className="w-full h-9 px-3 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-white font-medium focus:ring-1 focus:ring-primary"
                                    >
                                        {Object.keys(DEPARTMENT_RUBRICS).map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobLocation" className="text-xs text-neutral-300">Location *</Label>
                                    <Input
                                        id="newJobLocation"
                                        required
                                        placeholder="e.g. Remote, US or San Francisco, CA"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobType" className="text-xs text-neutral-300">Employment Type</Label>
                                    <select
                                        id="newJobType"
                                        value={jobType}
                                        onChange={(e) => setJobType(e.target.value)}
                                        className="w-full h-9 px-3 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-white font-medium focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobExp" className="text-xs text-neutral-300">Experience Level</Label>
                                    <select
                                        id="newJobExp"
                                        value={experienceLevel}
                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                        className="w-full h-9 px-3 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-white font-medium focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Entry-Level">Entry-Level</option>
                                        <option value="Mid-Level">Mid-Level</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Lead / Manager">Lead / Manager</option>
                                        <option value="Executive">Executive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobMinSalary" className="text-xs text-neutral-300">Min Salary</Label>
                                    <Input
                                        id="newJobMinSalary"
                                        type="number"
                                        placeholder="100000"
                                        value={minSalary}
                                        onChange={(e) => setMinSalary(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobMaxSalary" className="text-xs text-neutral-300">Max Salary</Label>
                                    <Input
                                        id="newJobMaxSalary"
                                        type="number"
                                        placeholder="140000"
                                        value={maxSalary}
                                        onChange={(e) => setMaxSalary(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobCurrency" className="text-xs text-neutral-300">Currency</Label>
                                    <Input
                                        id="newJobCurrency"
                                        placeholder="USD"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="newJobSkills" className="text-xs text-neutral-300">Required Skills (comma-separated) *</Label>
                                <Input
                                    id="newJobSkills"
                                    required
                                    placeholder="React, TypeScript, GraphQL, Docker"
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    className="bg-neutral-950 border-neutral-800 text-xs h-9 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="newJobDesc" className="text-xs text-neutral-300">Role Description *</Label>
                                <textarea
                                    id="newJobDesc"
                                    rows={3}
                                    required
                                    placeholder="Overview of the position, team mission, and high-level expectations..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobResp" className="text-xs text-neutral-300">Key Responsibilities (one per line)</Label>
                                    <textarea
                                        id="newJobResp"
                                        rows={3}
                                        value={responsibilitiesInput}
                                        onChange={(e) => setResponsibilitiesInput(e.target.value)}
                                        className="w-full p-2.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newJobReq" className="text-xs text-neutral-300">Job Requirements (one per line)</Label>
                                    <textarea
                                        id="newJobReq"
                                        rows={3}
                                        value={requirementsInput}
                                        onChange={(e) => setRequirementsInput(e.target.value)}
                                        className="w-full p-2.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evaluation Method & Rubric Configuration */}
                    <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" /> 2. AI Evaluation Mode & Rubric (100 Points)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Configure how Gemini AI audits and scores candidate evidence for this specific role.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div
                                    onClick={() => setEvaluationType('TECHNICAL_GITHUB')}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        evaluationType === 'TECHNICAL_GITHUB'
                                            ? 'border-indigo-500 bg-indigo-950/30'
                                            : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                                        <Github className="w-4 h-4" /> GitHub Codebase Audit
                                    </div>
                                    <p className="text-[11px] text-neutral-400">
                                        Inspects genuine repo files, architecture, tests, error handling & git history.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setEvaluationType('NON_TECHNICAL_ASSIGNMENT')}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        evaluationType === 'NON_TECHNICAL_ASSIGNMENT'
                                            ? 'border-amber-500 bg-amber-950/30'
                                            : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                                        <FileText className="w-4 h-4" /> Practical Case Study
                                    </div>
                                    <p className="text-[11px] text-neutral-400">
                                        Audits sales pitches, marketing campaigns, financial models, or support scripts.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setEvaluationType('RESUME_ONLY')}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        evaluationType === 'RESUME_ONLY'
                                            ? 'border-emerald-500 bg-emerald-950/30'
                                            : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                                        <CheckCircle2 className="w-4 h-4" /> Resume-Only Match
                                    </div>
                                    <p className="text-[11px] text-neutral-400">
                                        Deep contextual semantic matching against candidate career experience and skills.
                                    </p>
                                </div>
                            </div>

                            {evaluationType === 'NON_TECHNICAL_ASSIGNMENT' && (
                                <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/10 border border-amber-500/30">
                                    <Label htmlFor="newJobAssignmentBrief" className="text-xs font-semibold text-amber-300">Assignment Brief / Prompt for Candidates *</Label>
                                    <textarea
                                        id="newJobAssignmentBrief"
                                        rows={3}
                                        value={assignmentBrief}
                                        onChange={(e) => setAssignmentBrief(e.target.value)}
                                        className="w-full p-2.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}

                            {/* Rubric Weights */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                                        <span>Rubric Criteria Breakdown</span>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${totalWeight === 100 ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}
                                        >
                                            Total: {totalWeight} / 100 Points
                                        </Badge>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addRubricItem}
                                        className="h-7 text-xs border-neutral-800 text-neutral-300"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Criterion
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {rubric.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800"
                                        >
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateRubricItem(idx, 'name', e.target.value)}
                                                className="bg-transparent border-none text-xs text-white h-7 flex-1 focus:ring-0"
                                                placeholder="Criterion name"
                                            />
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Input
                                                    type="number"
                                                    value={item.weight}
                                                    onChange={(e) => updateRubricItem(idx, 'weight', Number(e.target.value))}
                                                    className="w-16 h-7 text-xs bg-neutral-900 border-neutral-700 text-center font-bold text-primary"
                                                />
                                                <span className="text-xs text-neutral-500 font-semibold">pts</span>
                                            </div>
                                            {rubric.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRubricItem(idx)}
                                                    className="text-neutral-500 hover:text-red-400 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-400 text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.push('/recruiter')}
                            className="text-xs text-neutral-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || totalWeight !== 100}
                            className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10 px-6 shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing Opening...
                                </>
                            ) : (
                                <>
                                    Publish Vacancy to Job Board <ArrowRight className="w-4 h-4 ml-1.5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
