'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FileUp, Sparkles, CheckCircle2, AlertCircle, Loader2,
    Github, Globe, Linkedin, User, Briefcase, GraduationCap, ArrowRight, Trash2
} from 'lucide-react';

interface IWorkExperience {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

interface IEducation {
    institution: string;
    degree: string;
    year?: string;
}

export default function CandidateProfilePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [headline, setHeadline] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [workExperience, setWorkExperience] = useState<IWorkExperience[]>([]);
    const [education, setEducation] = useState<IEducation[]>([]);
    const [resumeText, setResumeText] = useState('');

    useEffect(() => {
        let isCancelled = false;
        fetch('/api/candidate/profile')
            .then(res => res.json())
            .then(data => {
                if (!isCancelled && data.success && data.profile) {
                    const p = data.profile;
                    if (p.user?.name) setName(p.user.name);
                    if (p.user?.email) setEmail(p.user.email);
                    if (p.user?.phone) setPhone(p.user.phone);
                    if (p.headline) setHeadline(p.headline);
                    if (p.bio) setBio(p.bio);
                    if (Array.isArray(p.skills)) setSkills(p.skills);
                    if (p.githubUrl) setGithubUrl(p.githubUrl);
                    if (p.portfolioUrl) setPortfolioUrl(p.portfolioUrl);
                    if (p.linkedinUrl) setLinkedinUrl(p.linkedinUrl);
                    if (Array.isArray(p.workExperience)) setWorkExperience(p.workExperience);
                    if (Array.isArray(p.education)) setEducation(p.education);
                    if (p.resumeText) setResumeText(p.resumeText);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!isCancelled) setLoadingProfile(false);
            });
        return () => { isCancelled = true; };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingResume(true);
        setSaveStatus({ type: 'idle', message: '' });

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const res = await fetch('/api/candidate/resume', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const parsed = data.parsed;
                if (parsed.headline && !headline) setHeadline(parsed.headline);
                if (parsed.bio && !bio) setBio(parsed.bio);
                if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
                    setSkills(Array.from(new Set([...skills, ...parsed.skills])));
                }
                if (Array.isArray(parsed.workExperience) && parsed.workExperience.length > 0) {
                    setWorkExperience(parsed.workExperience);
                }
                if (Array.isArray(parsed.education) && parsed.education.length > 0) {
                    setEducation(parsed.education);
                }
                if (data.resumeText) {
                    setResumeText(data.resumeText);
                }
                setSaveStatus({ type: 'success', message: 'PDF parsed successfully with Gemini AI! Review and save your profile.' });
            } else {
                setSaveStatus({ type: 'error', message: data.error || 'Failed to parse resume.' });
            }
        } catch {
            setSaveStatus({ type: 'error', message: 'Network error parsing PDF file.' });
        } finally {
            setIsUploadingResume(false);
        }
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (!skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
        }
        setNewSkill('');
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus({ type: 'idle', message: '' });

        try {
            const res = await fetch('/api/candidate/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline,
                    bio,
                    skills,
                    githubUrl,
                    portfolioUrl,
                    linkedinUrl,
                    workExperience,
                    education,
                    resumeText
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSaveStatus({ type: 'success', message: 'Profile saved successfully!' });
            } else {
                setSaveStatus({ type: 'error', message: data.error || 'Failed to save profile.' });
            }
        } catch {
            setSaveStatus({ type: 'error', message: 'Network error saving profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-800 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs text-slate-500 font-medium">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16 px-4 md:px-8 max-w-4xl mx-auto pt-6 text-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Profile Intelligence
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Career Profile</h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">
                        Upload your PDF resume to auto-populate your skills and experience with Gemini AI.
                    </p>
                </div>

                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs">
                    <Link href="/jobs">
                        Browse Open Jobs <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                </Button>
            </div>

            {/* AI Resume Uploader Dropzone */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                            <FileUp className="w-5 h-5 text-indigo-600" /> Auto-Parse Resume with AI
                        </h2>
                        <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                            Upload your PDF resume. Gemini extracts your exact technical or domain skills, work history, and education directly into your profile.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingResume}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-5 shadow-xs"
                        >
                            {isUploadingResume ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting Skills with AI...
                                </>
                            ) : (
                                <>
                                    <FileUp className="w-4 h-4 mr-2" /> Upload PDF Resume
                                </>
                            )}
                        </Button>
                        <span className="text-[10px] text-slate-400 font-medium">Supports .PDF (Max 5MB)</span>
                    </div>
                </div>

                {saveStatus.message && (
                    <div
                        className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                            saveStatus.type === 'error'
                                ? 'bg-red-50 border border-red-200 text-red-700'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                    >
                        {saveStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        <span>{saveStatus.message}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* 1. Professional Identity */}
                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-600" /> 1. Professional Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="candNameInput" className="text-xs font-semibold text-slate-700">Full Name</Label>
                                <Input
                                    id="candNameInput"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="candEmailInput" className="text-xs font-semibold text-slate-700">Email Address</Label>
                                <Input
                                    id="candEmailInput"
                                    value={email}
                                    disabled
                                    className="bg-slate-100 border-slate-200 text-xs h-9 text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="candPhoneInput" className="text-xs font-semibold text-slate-700">Phone</Label>
                                <Input
                                    id="candPhoneInput"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="candHeadlineInput" className="text-xs font-semibold text-slate-700">Professional Headline</Label>
                            <Input
                                id="candHeadlineInput"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                placeholder="e.g. Senior Frontend Engineer | React & TypeScript or B2B Growth Lead"
                                className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="candBioInput" className="text-xs font-semibold text-slate-700">Short Bio / Career Highlights</Label>
                            <textarea
                                id="candBioInput"
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Brief overview of your experience, passion, and accomplishments..."
                                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="candGithubInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Github className="w-3.5 h-3.5" /> GitHub Profile
                                </Label>
                                <Input
                                    id="candGithubInput"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/username"
                                    className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="candPortInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" /> Portfolio URL
                                </Label>
                                <Input
                                    id="candPortInput"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    placeholder="https://myportfolio.dev"
                                    className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="candLinkInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                                </Label>
                                <Input
                                    id="candLinkInput"
                                    value={linkedinUrl}
                                    onChange={(e) => setLinkedinUrl(e.target.value)}
                                    placeholder="https://linkedin.com/in/username"
                                    className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 focus:bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Demonstrated Skills */}
                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> 2. Demonstrated Skills &amp; Competencies
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Skills used for semantic matching against open roles across 8 industries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                placeholder="Add skill (e.g. Next.js, Financial Modeling, B2B Sales)..."
                                className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 flex-1 focus:bg-white"
                            />
                            <Button
                                type="button"
                                onClick={addSkill}
                                className="bg-slate-800 hover:bg-slate-900 text-white text-xs h-9 px-4 shrink-0 font-bold"
                            >
                                Add Skill
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            {skills.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No skills listed yet. Upload your resume to extract them automatically.</p>
                            ) : (
                                skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                                    >
                                        <span>{skill}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="text-slate-400 hover:text-red-500 text-sm leading-none ml-1 font-bold"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Work Experience */}
                {workExperience.length > 0 && (
                    <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-emerald-600" /> 3. Extracted Work History ({workExperience.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {workExperience.map((exp, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                    <div className="flex justify-between items-start">
                                        <strong className="text-slate-900 text-sm font-bold">{exp.role}</strong>
                                        <span className="text-slate-500 text-[11px] font-medium">{exp.startDate} - {exp.endDate || 'Present'}</span>
                                    </div>
                                    <p className="text-emerald-700 font-semibold">{exp.company}</p>
                                    {exp.description && (
                                        <p className="text-slate-600 leading-relaxed pt-1">{exp.description}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* 4. Education */}
                {education.length > 0 && (
                    <Card className="bg-white border-slate-200 shadow-xs rounded-2xl">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-emerald-600" /> 4. Education &amp; Credentials ({education.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {education.map((edu, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                                    <div>
                                        <strong className="text-slate-900 font-bold block">{edu.degree}</strong>
                                        <span className="text-slate-500">{edu.institution}</span>
                                    </div>
                                    {edu.year && <span className="text-slate-600 font-semibold">{edu.year}</span>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 shadow-sm"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Profile...
                            </>
                        ) : (
                            'Save Career Profile'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
