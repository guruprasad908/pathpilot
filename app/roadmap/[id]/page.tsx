import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import GalaxyCard from '../../../components/GalaxyCard';

export const dynamic = 'force-dynamic';

export default async function RoadmapStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
        redirect('/login');
    }

    const resolvedParams = await params;

    const res = await fetch(`${process.env.APP_URL}/api/roadmaps/${resolvedParams.id}`, {
        cache: 'no-store',
        headers: {
            Cookie: `session=${session}`
        }
    });

    if (!res.ok) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
                <NavBar />
                <div className="flex-1 flex items-center justify-center w-full">
                    <div className="text-red-400 p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
                        Roadmap not found or unauthorized access.
                    </div>
                </div>
            </div>
        );
    }

    const roadmap = await res.json();

    return (
        <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 font-display">
            <NavBar />

            <div className="container-standard py-[var(--spacing-sys-2xl)]">
                <header className="mb-[var(--space-5)] border-b border-[var(--color-galaxy-border)] pb-[var(--spacing-sys-lg)] flex flex-col gap-[var(--spacing-sys-md)]">
                    <div className="inline-block px-[var(--spacing-sys-md)] py-[var(--spacing-sys-sm)] bg-white/5 text-white text-sm font-semibold rounded-full border border-white/10 w-max">
                        Active Study Module
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                        {roadmap.title}
                    </h1>
                </header>

                <main className="flex flex-col gap-[var(--space-5)]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />
                        <div className="space-y-12">
                            {roadmap.galaxies.map((galaxy: any) => (
                                <GalaxyCard key={galaxy.id} galaxy={galaxy} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
