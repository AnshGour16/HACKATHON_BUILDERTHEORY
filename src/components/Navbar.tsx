import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Briefcase, Users, LayoutDashboard, LogIn, LogOut,
    User as UserIcon, PlusCircle, Search, Sparkles
} from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Navbar() {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const isRecruiterOrAdmin = userRole === 'ADMIN' || userRole === 'JUDGE' || userRole === 'RECRUITER' || session?.user?.email === 'admin@hackathon.com';

    return (
        <nav className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                            HireSphere <span className="text-emerald-600 font-bold">AI</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase leading-none">
                            Talent Intelligence Platform
                        </span>
                    </div>
                </Link>

                <div className="flex gap-2.5 items-center">
                    <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold">
                        <Link href="/jobs">
                            <Search className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                            Explore Jobs
                        </Link>
                    </Button>

                    {session ? (
                        <>
                            {isRecruiterOrAdmin ? (
                                <>
                                    <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold">
                                        <Link href="/recruiter">
                                            <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                                            Recruiter Pipeline
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-3.5 shadow-sm">
                                        <Link href="/recruiter/jobs/new">
                                            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Post Job
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold">
                                        <Link href="/candidate/profile">
                                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                                            My Profile &amp; Resume
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 shadow-sm">
                                        <Link href="/dashboard">
                                            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                                            My Applications
                                        </Link>
                                    </Button>
                                </>
                            )}

                            <div className="h-5 w-px bg-slate-200 mx-1" />

                            <div className="flex items-center gap-2">
                                <div className="flex items-center text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                    <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                    <span className="truncate max-w-[120px]">{session.user?.name || 'Account'}</span>
                                </div>
                                <Button asChild variant="outline" size="sm" className="border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs h-8">
                                    <Link href="/api/auth/signout">
                                        <LogOut className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9 px-3.5">
                                <Link href="/login">
                                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                    Sign In
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shadow-sm">
                                <Link href="/register">
                                    Get Started
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
