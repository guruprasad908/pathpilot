import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GalaxySceneWrapper from '../../../components/galaxy/GalaxySceneWrapper';

export const dynamic = 'force-dynamic';

export default async function GalaxyPage({ params }: { params: Promise<{ roadmapId: string }> }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
        redirect('/login');
    }

    const resolvedParams = await params;

    const res = await fetch(`${process.env.APP_URL}/api/roadmaps/${resolvedParams.roadmapId}`, {
        cache: 'no-store',
        headers: {
            Cookie: `session=${session}`
        }
    });

    if (!res.ok) {
        return (
            <div className="w-full h-screen bg-galaxy-bg flex flex-col items-center justify-center">
                <div className="text-red-400 p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
                    Roadmap not found or unauthorized access.
                </div>
            </div>
        );
    }

    const roadmap = await res.json();

    return (
        <main className="w-full h-screen overflow-hidden">
            <GalaxySceneWrapper roadmap={roadmap} />
        </main>
    );
}
