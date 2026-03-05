import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '../../components/NavBar';
import MissionLog from './MissionLog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Roadmaps' };

export default async function RoadmapsPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
        redirect('/login');
    }

    const res = await fetch(`${process.env.APP_URL}/api/roadmaps/all`, {
        cache: 'no-store',
        headers: { Cookie: `session=${session}` }
    });

    if (!res.ok) {
        return (
            <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 flex flex-col font-display">
                <NavBar />
                <div className="flex-1 flex items-center justify-center p-16">
                    <div className="text-rose-400 p-6 bg-rose-950/20 border border-rose-500/50 rounded-xl font-mono uppercase tracking-widest-xl text-xs">
                        [!] Failed to load mission archives.
                    </div>
                </div>
            </div>
        );
    }

    const roadmaps = await res.json();

    return (
        <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 font-display">
            <NavBar />

            <div className="container-standard py-[var(--spacing-sys-2xl)]">
                <header className="mb-12 border-b border-white/5 pb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 font-display">
                            Mission <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Archives</span>
                        </h1>
                        <p className="text-zinc-500 text-lg max-w-2xl leading-relaxed font-light">
                            All initialized learning sequences. Execute a sequence to explore its trajectory, or set it as active for the primary mission HUD.
                        </p>
                    </div>
                </header>

                <main className="flex flex-col gap-[var(--space-5)]">
                    <MissionLog initialRoadmaps={roadmaps} />
                </main>
            </div>
        </div>
    );
}
