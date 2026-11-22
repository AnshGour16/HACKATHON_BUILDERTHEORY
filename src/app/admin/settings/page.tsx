'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/hackathons');
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
            <div className="animate-spin text-indigo-600 w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-slate-500 text-sm font-medium">Redirecting to Event Settings &amp; Themes...</p>
        </div>
    );
}
