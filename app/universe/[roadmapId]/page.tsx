'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressionMap from '@/components/universe/ProgressionMap';
import NavBar from '@/components/NavBar';

export default function UniversePage() {
    const params = useParams();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchRoadmap = useCallback(async () => {
        const id = params?.roadmapId;

        if (!id) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/roadmaps/${id}`);
            if (!res.ok) throw new Error('Failed to load roadmap');
            const data = await res.json();
            setRoadmap(data);
        } catch (error) {
            console.error('Failed to fetch roadmap:', error);
        } finally {
            setLoading(false);
        }
    }, [params?.roadmapId]);

    useEffect(() => {
        fetchRoadmap();
    }, [fetchRoadmap]);

    useEffect(() => {
        if (roadmap?.title) {
            document.title = `${roadmap.title} | PathPilot`;
        } else {
            document.title = 'Universe Map | PathPilot';
        }
    }, [roadmap]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-transparent">
                <NavBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest-xl animate-pulse">
                            Loading trajectory...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="min-h-screen flex flex-col bg-transparent">
                <NavBar />
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="text-rose-400 font-mono text-sm uppercase tracking-widest border border-rose-500/20 bg-rose-500/5 px-6 py-3 rounded-lg">
                        [!] Roadmap not found
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/roadmaps')}
                            className="text-zinc-500 hover:text-white text-[10px] font-mono uppercase tracking-widest-xl transition-all duration-300"
                        >
                            ← Back to My Roadmaps
                        </button>
                        <button
                            onClick={() => fetchRoadmap()}
                            className="text-white hover:text-emerald-400 text-[10px] font-mono uppercase tracking-widest-xl transition-all duration-300 border border-white/10 px-4 py-2 rounded"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-transparent">
            <NavBar />
            {/* Map fills remaining viewport height */}
            <div className="flex-1 relative overflow-hidden">
                <ProgressionMap roadmap={roadmap} onSubtopicComplete={fetchRoadmap} />
            </div>
        </div>
    );
}
