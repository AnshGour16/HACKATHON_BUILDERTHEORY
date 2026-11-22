'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Users, User, Trophy, ArrowRight,
    Sparkles, Briefcase, Building2
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
    const [members] = useState<IMemberInput[]>([{ name: '', email: '', college: '' }]);

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

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 max-w-4xl mx-auto relative text-slate-800">
            <div className="space-y-6 relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        HireSphere AI Registration
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Your Verified Account</h1>
                    <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto">
                        Join the all-industry talent intelligence platform as a candidate, hiring recruiter, or hackathon participant.
                    </p>

                    {/* Role Selection Tabs */}
                    <div className="flex max-w-md mx-auto bg-slate-100 p-1 rounded-xl border border-slate-200 mt-4">
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('CANDIDATE'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'CANDIDATE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <User className="w-3.5 h-3.5 text-indigo-600" /> Candidate
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('RECRUITER'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'RECRUITER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Recruiter
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRegistrationRole('TEAM'); setError(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                                registrationRole === 'TEAM' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5 text-amber-600" /> Team Leader
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* CANDIDATE REGISTRATION FORM */}
                    {registrationRole === 'CANDIDATE' && (
                        <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                    <User className="w-4 h-4 text-emerald-600" /> Candidate Profile Information
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">Apply to open industry jobs and demonstrate real capabilities</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candRegName" className="text-xs font-semibold text-slate-700">Full Name *</Label>
                                        <Input
                                            id="candRegName"
                                            required
                                            placeholder="Jane Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candRegEmail" className="text-xs font-semibold text-slate-700">Email Address (Login ID) *</Label>
                                        <Input
                                            id="candRegEmail"
                                            type="email"
                                            required
                                            placeholder="jane@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candRegPass" className="text-xs font-semibold text-slate-700">Password *</Label>
                                        <Input
                                            id="candRegPass"
                                            type="password"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="candRegPhone" className="text-xs font-semibold text-slate-700">Phone Number</Label>
                                        <Input
                                            id="candRegPhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="candRegHead" className="text-xs font-semibold text-slate-700">Professional Headline</Label>
                                        <Input
                                            id="candRegHead"
                                            placeholder="e.g. Senior Frontend Engineer | React & TypeScript or B2B Account Executive"
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* RECRUITER REGISTRATION FORM */}
                    {registrationRole === 'RECRUITER' && (
                        <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                    <Building2 className="w-4 h-4 text-emerald-600" /> Recruiter &amp; Company Account
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">Post vacancies, calibrate evaluation rubrics, and use Recruiter Copilot</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegName" className="text-xs font-semibold text-slate-700">Your Full Name *</Label>
                                        <Input
                                            id="recRegName"
                                            required
                                            placeholder="Alex Johnson"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegEmail" className="text-xs font-semibold text-slate-700">Work Email (Login ID) *</Label>
                                        <Input
                                            id="recRegEmail"
                                            type="email"
                                            required
                                            placeholder="alex@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegPass" className="text-xs font-semibold text-slate-700">Password *</Label>
                                        <Input
                                            id="recRegPass"
                                            type="password"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegPhone" className="text-xs font-semibold text-slate-700">Direct Phone</Label>
                                        <Input
                                            id="recRegPhone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegComp" className="text-xs font-semibold text-slate-700">Hiring Company Name *</Label>
                                        <Input
                                            id="recRegComp"
                                            required
                                            placeholder="e.g. Acme Tech Corporation"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="recRegTitle" className="text-xs font-semibold text-slate-700">Your Job Title</Label>
                                        <Input
                                            id="recRegTitle"
                                            placeholder="e.g. Head of Talent Acquisition or Engineering Lead"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* HACKATHON TEAM REGISTRATION FORM */}
                    {registrationRole === 'TEAM' && (
                        <div className="space-y-6">
                            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                        <Trophy className="w-4 h-4 text-amber-600" /> 1. Hackathon &amp; Track Selection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loadingHackathons ? (
                                        <p className="text-xs text-slate-500">Loading active hackathons...</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="regHackSelect" className="text-xs font-semibold text-slate-700">Event</Label>
                                                <select
                                                    id="regHackSelect"
                                                    value={selectedHackathonId}
                                                    onChange={(e) => handleHackathonChange(e.target.value)}
                                                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
                                                >
                                                    {hackathons.map(h => (
                                                        <option key={h._id} value={h._id}>{h.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="regTrackSelect" className="text-xs font-semibold text-slate-700">Theme / Track</Label>
                                                <select
                                                    id="regTrackSelect"
                                                    value={track}
                                                    onChange={(e) => setTrack(e.target.value)}
                                                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
                                                >
                                                    {hackathons.find(h => h._id === selectedHackathonId)?.tracks?.map((t, idx) => (
                                                        <option key={idx} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                        <User className="w-4 h-4 text-emerald-600" /> 2. Team Leader Account
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leadRegName" className="text-xs font-semibold text-slate-700">Full Name *</Label>
                                            <Input
                                                id="leadRegName"
                                                required
                                                placeholder="Alex Johnson"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leadRegEmail" className="text-xs font-semibold text-slate-700">Email (Login ID) *</Label>
                                            <Input
                                                id="leadRegEmail"
                                                type="email"
                                                required
                                                placeholder="alex@university.edu"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leadRegPass" className="text-xs font-semibold text-slate-700">Password *</Label>
                                            <Input
                                                id="leadRegPass"
                                                type="password"
                                                required
                                                minLength={6}
                                                placeholder="Minimum 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="leadRegPhone" className="text-xs font-semibold text-slate-700">Contact Phone</Label>
                                            <Input
                                                id="leadRegPhone"
                                                type="tel"
                                                placeholder="+1 (555) 000-0000"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label htmlFor="leadRegCollege" className="text-xs font-semibold text-slate-700">College / Organization</Label>
                                            <Input
                                                id="leadRegCollege"
                                                placeholder="e.g. Stanford University"
                                                value={college}
                                                onChange={(e) => setCollege(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                                        <Users className="w-4 h-4 text-emerald-600" /> 3. Team &amp; Project Scope
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="teamRegName" className="text-xs font-semibold text-slate-700">Official Team Name *</Label>
                                            <Input
                                                id="teamRegName"
                                                required
                                                placeholder="NeuralNexus"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="teamRegProj" className="text-xs font-semibold text-slate-700">Project Title</Label>
                                            <Input
                                                id="teamRegProj"
                                                placeholder="Autonomous AI Recruiter Agent"
                                                value={projectTitle}
                                                onChange={(e) => setProjectTitle(e.target.value)}
                                                className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="teamRegProb" className="text-xs font-semibold text-slate-700">Problem Statement *</Label>
                                        <textarea
                                            id="teamRegProb"
                                            rows={2}
                                            required
                                            placeholder="What real problem does your team solve?"
                                            value={problemStatement}
                                            onChange={(e) => setProblemStatement(e.target.value)}
                                            className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-xs text-slate-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-emerald-700 hover:underline font-bold">
                                Sign In
                            </Link>
                        </p>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-11 text-xs shadow-xs"
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
