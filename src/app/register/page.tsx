'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users, User, Trophy, Plus, Trash2, ArrowRight,
    Sparkles, Briefcase, Building2, ShieldCheck, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface IHackathon {
    _id: string;
    name: string;
    theme: string;
    description: string;
    tracks: { name: string; requiredSlides?: string[] }[];
}

interface IMemberInput {
    name: string;
    email: string;
    college: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [registrationRole, setRegistrationRole] = useState<'CANDIDATE' | 'RECRUITER' | 'TEAM'>('CANDIDATE');

    // Candidate / Recruiter Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [title, setTitle] = useState('');
    const [headline, setHeadline] = useState('');

    // Hackathon Team Leader Fields
    const [hackathons, setHackathons] = useState<IHackathon[]>([]);
    const [selectedHackathonId, setSelectedHackathonId] = useState('');
    const [loadingHackathons, setLoadingHackathons] = useState(false);
    const [college, setCollege] = useState('');
    const [teamName, setTeamName] = useState('');
    const [track, setTrack] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [problemStatement, setProblemStatement] = useState('');
    const [solutionDescription, setSolutionDescription] = useState('');
    const [members, setMembers] = useState<IMemberInput[]>([{ name: '', email: '', college: '' }]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (registrationRole !== 'TEAM') return;
        let isCancelled = false;
        fetch('/api/hackathons')
            .then(res => res.json())
            .then(data => {
                if (!isCancelled && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setHackathons(data.data);
                    const first = data.data[0];
                    setSelectedHackathonId(first._id);
                    if (first.tracks && first.tracks.length > 0) {
                        setTrack(first.tracks[0].name);
                    }
                }
            })
            .catch(console.error)
            .finally(() => {
                if (!isCancelled) setLoadingHackathons(false);
            });
        return () => { isCancelled = true; };
    }, [registrationRole]);

    const handleHackathonChange = (hId: string) => {
        setSelectedHackathonId(hId);
        const found = hackathons.find(h => h._id === hId);
        if (found && found.tracks && found.tracks.length > 0) {
            setTrack(found.tracks[0].name);
        } else {
            setTrack('');
        }
    };

    const addMember = () => {
        if (members.length >= 6) return;
        setMembers([...members, { name: '', email: '', college: college || '' }]);
    };

    const updateMember = (index: number, field: keyof IMemberInput, val: string) => {
        const updated = [...members];
        updated[index][field] = val;
        setMembers(updated);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            let payload: Record<string, unknown> = {
                role: registrationRole,
                email,
                password
            };

            if (registrationRole === 'CANDIDATE') {
                payload = {
                    ...payload,
                    name,
                    phone,
                    headline
                };
            } else if (registrationRole === 'RECRUITER') {
                payload = {
                    ...payload,
                    name,
                    companyName,
                    title,
                    phone
                };
            } else {
                payload = {
                    ...payload,
                    teamName,
                    leaderName: name,
                    leaderPhone: phone,
                    college,
                    hackathonId: selectedHackathonId,
                    track,
                    projectTitle,
                    problemStatement,
                    solutionDescription,
                    members
                };
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed.');
                setIsSubmitting(false);
                return;
            }

            // Automatically sign in
            const signInRes = await signIn('credentials', {
                redirect: false,
                email,
                password
            });

            if (signInRes?.ok) {
                if (registrationRole === 'RECRUITER') {
                    router.push('/recruiter');
                } else if (registrationRole === 'CANDIDATE') {
                    router.push('/candidate/profile');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            } else {
                router.push('/login?registered=true');
            }

        } catch (err) {
            console.error(err);
            setError('A network error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    const selectedHackathon = hackathons.find(h => h._id === selectedHackathonId) || hackathons[0];

    return (
        <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto relative">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="space-y-6 relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        HireSphere AI Registration
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Your Verified Account</h1>
                    <p className="text-neutral-400 text-sm max-w-xl mx-auto">
                        Join the all-industry talent intelligence platform as a candidate, hiring team, or hackathon participant.
                    </p>

                    {/* Role Selection Tabs */}
                    <div className="flex max-w-md mx-auto bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 mt-4">
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('CANDIDATE'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'CANDIDATE' ? 'bg-primary text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" /> Candidate
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('RECRUITER'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'RECRUITER' ? 'bg-primary text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Briefcase className="w-3.5 h-3.5" /> Recruiter
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('TEAM'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'TEAM' ? 'bg-primary text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5" /> Hackathon Team
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* CANDIDATE REGISTRATION FORM */}
                    {registrationRole === 'CANDIDATE' && (
                        <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                    <User className="w-4 h-4 text-primary" /> Candidate Profile Information
                                </CardTitle>
                                <CardDescription>Apply to open industry jobs and demonstrate real capabilities</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candName" className="text-xs text-neutral-300">Full Name *</Label>
                                        <Input
                                            id="candName"
                                            required
                                            placeholder="Jane Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candEmail" className="text-xs text-neutral-300">Email Address (Login ID) *</Label>
                                        <Input
                                            id="candEmail"
                                            type="email"
                                            required
                                            placeholder="jane@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candPassword" className="text-xs text-neutral-300">Password *</Label>
                                        <Input
                                            id="candPassword"
                                            type="password"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candPhone" className="text-xs text-neutral-300">Phone Number</Label>
                                        <Input
                                            id="candPhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="candHeadline" className="text-xs text-neutral-300">Professional Headline</Label>
                                        <Input
                                            id="candHeadline"
                                            placeholder="e.g. Senior Frontend Engineer | React & TypeScript or B2B Account Executive"
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* RECRUITER REGISTRATION FORM */}
                    {registrationRole === 'RECRUITER' && (
                        <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Building2 className="w-4 h-4 text-primary" /> Recruiter & Company Account
                                </CardTitle>
                                <CardDescription>Post vacancies, calibrate evaluation rubrics, and use Recruiter Copilot</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recName" className="text-xs text-neutral-300">Your Full Name *</Label>
                                        <Input
                                            id="recName"
                                            required
                                            placeholder="Alex Johnson"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recEmail" className="text-xs text-neutral-300">Work Email (Login ID) *</Label>
                                        <Input
                                            id="recEmail"
                                            type="email"
                                            required
                                            placeholder="alex@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recPassword" className="text-xs text-neutral-300">Password *</Label>
                                        <Input
                                            id="recPassword"
                                            type="password"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recPhone" className="text-xs text-neutral-300">Direct Phone</Label>
                                        <Input
                                            id="recPhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recCompany" className="text-xs text-neutral-300">Hiring Company Name *</Label>
                                        <Input
                                            id="recCompany"
                                            required
                                            placeholder="e.g. Acme Tech Corporation"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recTitle" className="text-xs text-neutral-300">Your Job Title</Label>
                                        <Input
                                            id="recTitle"
                                            placeholder="e.g. Head of Talent Acquisition or Engineering Manager"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* HACKATHON TEAM REGISTRATION FORM */}
                    {registrationRole === 'TEAM' && (
                        <div className="space-y-6">
                            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                        <Trophy className="w-4 h-4 text-primary" /> 1. Hackathon & Theme Selection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loadingHackathons ? (
                                        <p className="text-xs text-neutral-400">Loading active hackathons...</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="teamHackathon">Event</Label>
                                                <select
                                                    id="teamHackathon"
                                                    value={selectedHackathonId}
                                                    onChange={(e) => handleHackathonChange(e.target.value)}
                                                    className="w-full h-10 px-3 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-white font-medium focus:ring-1 focus:ring-primary"
                                                >
                                                    {hackathons.map(h => (
                                                        <option key={h._id} value={h._id}>{h.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="teamTrack">Theme / Track</Label>
                                                <select
                                                    id="teamTrack"
                                                    value={track}
                                                    onChange={(e) => setTrack(e.target.value)}
                                                    className="w-full h-10 px-3 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-white font-medium focus:ring-1 focus:ring-primary"
                                                >
                                                    {selectedHackathon?.tracks?.map((t, idx) => (
                                                        <option key={idx} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                        <User className="w-4 h-4 text-primary" /> 2. Team Leader Account
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leaderName">Full Name *</Label>
                                            <Input
                                                id="leaderName"
                                                required
                                                placeholder="Alex Johnson"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leaderEmail">Email (Login ID) *</Label>
                                            <Input
                                                id="leaderEmail"
                                                type="email"
                                                required
                                                placeholder="alex@university.edu"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leaderPassword">Password *</Label>
                                            <Input
                                                id="leaderPassword"
                                                type="password"
                                                required
                                                minLength={6}
                                                placeholder="Minimum 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leaderPhone">Contact Phone Number</Label>
                                            <Input
                                                id="leaderPhone"
                                                type="tel"
                                                placeholder="+1 (555) 000-0000"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="leaderCollege">College / Organization</Label>
                                            <Input
                                                id="leaderCollege"
                                                placeholder="e.g. Stanford University"
                                                value={college}
                                                onChange={(e) => setCollege(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                                        <Users className="w-4 h-4 text-primary" /> 3. Team & Project Scope
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="tName">Official Team Name *</Label>
                                            <Input
                                                id="tName"
                                                required
                                                placeholder="NeuralNexus"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="pTitle">Project Title</Label>
                                            <Input
                                                id="pTitle"
                                                placeholder="Autonomous AI Recruiter Agent"
                                                value={projectTitle}
                                                onChange={(e) => setProjectTitle(e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 text-xs h-10 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pStatement">Problem Statement *</Label>
                                        <textarea
                                            id="pStatement"
                                            rows={2}
                                            required
                                            placeholder="What problem does your team solve?"
                                            value={problemStatement}
                                            onChange={(e) => setProblemStatement(e.target.value)}
                                            className="w-full p-2.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-xs text-neutral-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-semibold">
                                Sign In
                            </Link>
                        </p>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-extrabold px-8 h-11 text-xs"
                        >
                            {isSubmitting ? (
                                'Creating Account...'
                            ) : (
                                <>
                                    Complete {registrationRole === 'CANDIDATE' ? 'Candidate' : registrationRole === 'RECRUITER' ? 'Recruiter' : 'Team'} Registration <ArrowRight className="w-4 h-4 ml-1.5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
