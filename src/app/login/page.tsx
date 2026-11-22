'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, User, Shield, Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('recruiter@techhire.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginRole, setLoginRole] = useState<'CANDIDATE' | 'RECRUITER' | 'ADMIN' | 'TEAM'>('RECRUITER');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            const msg =
                res.error === 'CredentialsSignin' || res.error === 'Invalid credentials'
                    ? 'Invalid email or password'
                    : `Authentication failed: ${res.error}`;
            setError(msg);
            setIsLoading(false);
        } else {
            try {
                const sessionRes = await fetch('/api/auth/session');
                const sessionData = await sessionRes.json();
                const role = sessionData?.user?.role;
                const from = searchParams.get('from');

                if (from) {
                    router.push(from);
                } else if (role === 'RECRUITER') {
                    router.push('/recruiter');
                } else if (role === 'ADMIN' || role === 'JUDGE') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            } catch {
                router.push('/dashboard');
            }
        }
    };

    return (
        <Card className="w-full max-w-md shadow-md border-slate-200 bg-white relative z-10 rounded-2xl">
            <CardHeader className="text-center pb-5">
                <div className="mx-auto bg-emerald-50 border border-emerald-200 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
                    <Lock className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Portal Sign In</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                    {loginRole === 'RECRUITER'
                        ? 'Sign in to access your recruitment pipeline and AI copilot'
                        : loginRole === 'CANDIDATE'
                        ? 'Sign in to check job applications and AI scorecards'
                        : loginRole === 'ADMIN'
                        ? 'Sign in with organizer or hackathon judge credentials'
                        : 'Sign in with your team leader account'}
                </CardDescription>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mt-4 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => {
                            setLoginRole('RECRUITER');
                            setEmail('recruiter@techhire.com');
                            setPassword('password123');
                            setError('');
                        }}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                            loginRole === 'RECRUITER' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Recruiter
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginRole('CANDIDATE');
                            setEmail('alex@example.com');
                            setPassword('password123');
                            setError('');
                        }}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                            loginRole === 'CANDIDATE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <User className="w-3.5 h-3.5 text-indigo-600" /> Candidate
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginRole('ADMIN');
                            setEmail('admin@hackathon.com');
                            setPassword('admin123');
                            setError('');
                        }}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                            loginRole === 'ADMIN' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5 text-amber-600" /> Admin
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="userEmail" className="text-xs font-semibold text-slate-700">Email Address</Label>
                        <Input
                            id="userEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="userPassword" className="text-xs font-semibold text-slate-700">Password</Label>
                        <Input
                            id="userPassword"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-slate-50 border-slate-200 text-xs h-10 text-slate-900 focus:bg-white"
                        />
                    </div>

                    {error && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-xs" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                    </Button>

                    <div className="pt-2 text-center flex flex-wrap justify-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span>Auto-fill:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('recruiter@techhire.com');
                                setPassword('password123');
                                setLoginRole('RECRUITER');
                            }}
                            className="text-emerald-700 hover:underline font-bold"
                        >
                            Recruiter Demo
                        </button>
                        <span>&bull;</span>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('alex@example.com');
                                setPassword('password123');
                                setLoginRole('CANDIDATE');
                            }}
                            className="text-indigo-700 hover:underline font-bold"
                        >
                            Candidate Demo
                        </button>
                        <span>&bull;</span>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('admin@hackathon.com');
                                setPassword('admin123');
                                setLoginRole('ADMIN');
                            }}
                            className="text-amber-700 hover:underline font-bold"
                        >
                            Admin Demo
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                            Don&apos;t have an account yet?{' '}
                            <Link href="/register" className="text-emerald-700 hover:underline font-bold inline-flex items-center">
                                Register Here <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
            <Suspense fallback={<div className="text-slate-600 text-xs">Loading sign in...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
