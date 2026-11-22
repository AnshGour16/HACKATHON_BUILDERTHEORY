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
        <div className="min-h-screen bg-slate-50 pb-16 px-4 md:px-8 max-w-7xl mx-auto pt-8 text-slate-800">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1f2d] via-[#12283a] to-[#0d1f2d] text-white p-8 md:p-12 mb-8 shadow-md">
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        Evidence-Based AI Hiring
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                        Explore Verified Roles Across 8 Industries
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                        Apply with real demonstration evidence. Our AI evaluates practical code for software engineers, and authentic case studies for sales, marketing, finance, HR, and design.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 shadow-sm">
                            <Link href="/candidate/profile">
                                <FileText className="w-4 h-4 mr-1.5" /> Upload PDF Resume
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white text-xs h-9">
                            <Link href="/recruiter/jobs/new">
                                <Briefcase className="w-4 h-4 mr-1.5 text-emerald-400" /> Post a Job Opening
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by job title, company name, or skills (e.g. React, B2B Sales, Financial Modeling)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200 text-xs text-slate-900 h-10 placeholder:text-slate-400 focus:bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 h-10"
                        >
                            {JOB_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Department Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                    {DEPARTMENTS.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                selectedDept === dept
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Jobs Listing */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs">Fetching verified industry vacancies...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">No matching job listings found</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Try adjusting your search criteria or clear department filters to see all available openings.
                    </p>
                    <Button
                        onClick={() => { setSearchTerm(''); setSelectedDept('All Departments'); setSelectedType('All Types'); }}
                        variant="outline"
                        className="mt-4 border-slate-300 text-xs text-slate-700"
                    >
                        Reset All Filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredJobs.map(job => (
                        <Card
                            key={job._id}
                            className="bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between group rounded-2xl shadow-xs"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                                            {job.department}
                                        </span>
                                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-0.5 line-clamp-1">
                                            {job.title}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] shrink-0 font-semibold ${
                                            job.evaluationType === 'TECHNICAL_GITHUB'
                                                ? 'border-indigo-200 text-indigo-700 bg-indigo-50'
                                                : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT'
                                                ? 'border-amber-200 text-amber-700 bg-amber-50'
                                                : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                        }`}
                                    >
                                        {job.evaluationType === 'TECHNICAL_GITHUB' && <Github className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' && <FileText className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'RESUME_ONLY' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                        {job.evaluationType === 'TECHNICAL_GITHUB' ? 'GitHub Audit' : job.evaluationType === 'NON_TECHNICAL_ASSIGNMENT' ? 'Case Study' : 'Resume Match'}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 pt-1">
                                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                        {job.companyName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {job.location}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                        {job.jobType}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-0">
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                    {job.description}
                                </p>

                                {/* Skill Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {job.requiredSkills.slice(0, 4).map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {job.requiredSkills.length > 4 && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500">
                                            +{job.requiredSkills.length - 4} more
                                        </span>
                                    )}
                                </div>

                                {/* Bottom Metadata & Action */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    {job.salaryRange?.min ? (
                                        <div className="flex items-center text-xs text-emerald-700 font-bold">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span>
                                                {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency || 'USD'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-slate-500 font-medium">Competitive Pay</span>
                                    )}

                                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 shadow-xs">
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
