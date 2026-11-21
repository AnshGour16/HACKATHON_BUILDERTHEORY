'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Briefcase, Building2, MapPin, DollarSign, Search,
    Filter, Github, FileText, CheckCircle2, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

interface IJob {
    _id: string;
    title: string;
    companyName: string;
    department: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryRange?: { min?: number; max?: number; currency?: string };
    evaluationType: 'TECHNICAL_GITHUB' | 'NON_TECHNICAL_ASSIGNMENT' | 'RESUME_ONLY';
    requiredSkills: string[];
    description: string;
    status: string;
    createdAt: string;
}

const DEPARTMENTS = [
    'All Departments',
    'Software & IT',
    'Sales & BD',
    'Marketing',
    'Finance & Accounting',
    'Human Resources',
    'Operations',
    'Customer Support',
    'Design & Creative'
];

const JOB_TYPES = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];

export default function JobsPage() {
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [selectedType, setSelectedType] = useState('All Types');

    useEffect(() => {
        fetch('/api/jobs')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const list = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data.data) ? data.data : [];
                    setJobs(list);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.requiredSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDept =
            selectedDept === 'All Departments' ||
            job.department.toLowerCase() === selectedDept.toLowerCase() ||
            (selectedDept === 'Software & IT' && job.department === 'Software & IT') ||
            (selectedDept === 'Sales & BD' && job.department === 'Sales & Business Development');

        const matchesType =
            selectedType === 'All Types' ||
            job.jobType.toLowerCase() === selectedType.toLowerCase();

        return matchesSearch && matchesDept && matchesType;
    });

    return (
        <div className="min-h-screen pb-16 px-4 md:px-8 max-w-7xl mx-auto pt-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-neutral-800 p-8 md:p-12 mb-10 shadow-2xl">
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        Evidence-Based AI Hiring
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                        Explore Open Careers & Demonstrate Real Skills
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                        Apply to verified positions across 8 industry verticals. Our AI evaluates genuine capabilities — from GitHub repositories for engineers to real case studies for marketing, sales, finance, and design.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button asChild className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-9">
                            <Link href="/candidate/profile">
                                <FileText className="w-4 h-4 mr-1.5" /> Upload Resume & Build Profile
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-neutral-700 text-neutral-300 text-xs h-9">
                            <Link href="/recruiter/jobs/new">
                                <Briefcase className="w-4 h-4 mr-1.5 text-primary" /> Post a New Vacancy
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl backdrop-blur-md mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <Input
                            placeholder="Search by job title, company name, or skills (e.g. React, B2B Sales, SEO)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-neutral-950 border-neutral-800 text-sm text-white h-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 text-xs text-neutral-300 focus:outline-none focus:border-primary h-10"
                        >
                            {JOB_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Department Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0 mr-1" />
                    {DEPARTMENTS.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedDept === dept
                                    ? 'bg-primary text-black font-semibold'
                                    : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-neutral-800'
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Jobs Listing */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Fetching verified industry vacancies...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="py-16 text-center bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8">
                    <Briefcase className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">No matching job listings found</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                        Try adjusting your search criteria or clear department filters to see all available roles.
                    </p>
                    <Button
                        onClick={() => { setSearchTerm(''); setSelectedDept('All Departments'); setSelectedType('All Types'); }}
                        variant="outline"
                        className="mt-4 border-neutral-700 text-xs"
                    >
                        Reset All Filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredJobs.map(job => (
                        <Card
                            key={job._id}
                            className="bg-neutral-900/40 border-neutral-800 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between group backdrop-blur-sm"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                            {job.department}
                                        </span>
                                        <CardTitle className="text-lg font-bold text-white group-hover:text-primary transition-colors mt-0.5 line-clamp-1">
                                            {job.title}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] shrink-0 ${
                                            job.evaluationType === 'TECHNICAL_GITHUB'
                                                ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/20'
                                                : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT'
                                                ? 'border-amber-500/40 text-amber-300 bg-amber-950/20'
                                                : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                                        }`}
                                    >
                                        {job.evaluationType === 'TECHNICAL_GITHUB' && <Github className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' && <FileText className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'RESUME_ONLY' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'TECHNICAL_GITHUB' ? 'GitHub Audit' : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? 'Case Study' : 'Resume Match'}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-neutral-400 pt-1">
                                    <span className="flex items-center gap-1 font-medium text-neutral-300">
                                        <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                                        {job.companyName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                                        {job.location}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-semibold text-neutral-300">
                                        {job.jobType}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-0">
                                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                                    {job.description}
                                </p>

                                {/* Skill Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {job.requiredSkills.slice(0, 4).map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-medium text-neutral-300"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {job.requiredSkills.length > 4 && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] text-neutral-500">
                                            +{job.requiredSkills.length - 4} more
                                        </span>
                                    )}
                                </div>

                                {/* Bottom Metadata & Action */}
                                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                                    {job.salaryRange?.min ? (
                                        <div className="flex items-center text-xs text-neutral-300 font-semibold">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>
                                                {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency || 'USD'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-neutral-500">Competitive Compensation</span>
                                    )}

                                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-black font-semibold text-xs h-8 px-3">
                                        <Link href={`/jobs/${job._id}`}>
                                            Apply <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
