import React from 'react';
import PlanetSection from './PlanetSection';

export default function GalaxyCard({ galaxy }: { galaxy: any }) {
    return (
        <div className="border-t border-white/5 pt-16 mt-16 first:mt-0 first:border-0 relative">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest-xl">Galaxy System Deployed</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
                    {galaxy.title}
                </h2>
                <p className="text-zinc-500 mt-4 text-lg font-light leading-relaxed max-w-2xl">{galaxy.description || 'Exploring the vast unknown...'}</p>
            </div>

            <div className="flex flex-col">
                {galaxy.planets.map((planet: any) => (
                    <PlanetSection key={planet.id} planet={planet} />
                ))}
                {galaxy.planets.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-zinc-800/50 rounded-2xl">
                        <p className="text-[10px] text-zinc-600 font-mono italic uppercase tracking-widest-xl">No planetary systems detected in this sector.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
