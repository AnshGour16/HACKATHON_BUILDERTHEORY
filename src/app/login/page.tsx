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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/60 backdrop-blur-xl relative z-10">
            <CardHeader className="text-center pb-5">
                <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">HireSphere Portal Sign In</CardTitle>
                <CardDescription className="text-xs">
                    {loginRole === 'RECRUITER'
                        ? 'Sign in to access your recruitment pipeline and AI copilot'
                        : loginRole === 'CANDIDATE'
                        ? 'Sign in to check job applications and AI scorecards'
                        : loginRole === 'ADMIN'
                        ? 'Sign in with organizer or hackathon judge credentials'
                        : 'Sign in with your team leader account'}
                </CardDescription>

                {/* Role Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 mt-4 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => {
                            setLoginRole('RECRUITER');
                            setEmail('recruiter@techhire.com');
                            setPassword('password123');
                            setError('');
                        }}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                            loginRole === 'RECRUITER' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Briefcase className="w-3 h-3" /> Recruiter
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
                            loginRole === 'CANDIDATE' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <User className="w-3 h-3" /> Candidate
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
                            loginRole === 'ADMIN' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <Shield className="w-3 h-3" /> Admin/Judge
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="loginEmail" className="text-xs text-neutral-300">Email Address</Label>
                        <Input
                            id="loginEmail"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-neutral-950 border-neutral-800 text-xs h-10 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="loginPassword" className="text-xs text-neutral-300">Password</Label>
                        <Input
                            id="loginPassword"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-neutral-950 border-neutral-800 text-xs h-10 text-white"
                        />
                    </div>

                    {error && (
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-bold text-xs h-10" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                    </Button>

                    <div className="pt-2 text-center flex flex-wrap justify-center gap-2 text-[11px] text-neutral-400">
                        <span>Auto-fill:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('admin@hackathon.com');
                                setPassword('admin123');
                                setLoginRole('ADMIN');
                            }}
                            className="text-primary hover:underline"
                        >
                            Judge / Admin
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('recruiter@techhire.com');
                                setPassword('password123');
                                setLoginRole('RECRUITER');
                            }}
                            className="text-indigo-400 hover:underline"
                        >
                            Recruiter
                        </button>
                    </div>

                    <div className="pt-4 border-t border-neutral-800 text-center">
                        <p className="text-xs text-neutral-400">
                            Don&apos;t have an account yet?{' '}
                            <Link href="/register" className="text-primary hover:underline font-semibold inline-flex items-center">
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
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />
            <Suspense fallback={<div className="text-white text-xs">Loading login...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
