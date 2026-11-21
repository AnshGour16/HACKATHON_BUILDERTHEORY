import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Briefcase, Users, LayoutDashboard, LogIn, LogOut,
    User as UserIcon, PlusCircle, Search, Trophy, Sparkles
} from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Navbar() {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const isRecruiterOrAdmin = userRole === 'ADMIN' || userRole === 'JUDGE' || userRole === 'RECRUITER' || session?.user?.email === 'admin@hackathon.com';

    return (
        <nav className="w-full border-b border-primary/20 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-md shadow-primary/20">
                        <Sparkles className="w-4 h-4 text-black font-extrabold" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-white leading-tight">HireSphere AI</span>
                        <span className="text-[10px] text-neutral-400 font-medium leading-none">Talent Intelligence</span>
                    </div>
                </Link>

                <div className="flex gap-3 items-center">
                    <Button asChild variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs">
                        <Link href="/jobs">
                            <Search className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            Explore Jobs
                        </Link>
                    </Button>

                    {session ? (
                        <>
                            {isRecruiterOrAdmin ? (
                                <>
                                    <Button asChild variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs">
                                        <Link href="/recruiter">
                                            <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                                            Recruiter Pipeline
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-8">
                                        <Link href="/recruiter/jobs/new">
                                            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                                            Post Job
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs">
                                        <Link href="/candidate/profile">
                                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                                            My Profile &amp; Resume
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-8">
                                        <Link href="/dashboard">
                                            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                                            My Applications
                                        </Link>
                                    </Button>
                                </>
                            )}

                            <div className="h-5 w-px bg-neutral-800 mx-1" />

                            <div className="flex items-center gap-2">
                                <div className="flex items-center text-xs text-neutral-300 bg-neutral-900/60 px-2.5 py-1 rounded-lg border border-neutral-800">
                                    <UserIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                                    <span className="truncate max-w-[120px]">{session.user?.name || 'Account'}</span>
                                </div>
                                <Button asChild variant="outline" size="sm" className="border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8">
                                    <Link href="/api/auth/signout">
                                        <LogOut className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="border-neutral-800 text-white hover:bg-neutral-900 text-xs h-8">
                                <Link href="/login">
                                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                    Sign In
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-8">
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
