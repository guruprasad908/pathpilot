'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const GalaxyScene = dynamic(() => import('./GalaxyScene'), {
    ssr: false,
    loading: () => <div className="w-full h-screen bg-black flex items-center justify-center text-[var(--color-text-secondary)]">Initializing Warp Drive...</div>
});

export default function GalaxySceneWrapper({ roadmap }: { roadmap: any }) {
    return <GalaxyScene roadmap={roadmap} />;
}
