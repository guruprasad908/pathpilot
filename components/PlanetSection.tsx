'use client';

import React, { useState } from 'react';
import SubtopicItem from './SubtopicItem';

export default function PlanetSection({ planet }: { planet: any }) {
    const [isOpen, setIsOpen] = useState(true);

    // Auto-calculate planet progress
    const totalSubtopics = planet.subtopics.length;
    const completedSubtopics = planet.subtopics.filter((s: any) => s.status === 'completed').length;
    const planetProgress = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    return (
        <div className="bg-black/30 border border-white/5 rounded-2xl shadow-panel overflow-hidden mb-8 transition-all duration-300 hover:border-white/10">
            {/* Planet Header / Accordion Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-6 py-5 flex items-center justify-between bg-zinc-900/40 hover:bg-zinc-900/60 transition-all duration-300"
            >
                <div className="flex items-center gap-4">
                    <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">🌍</span>
                    <h4 className="text-lg font-bold text-white tracking-tight">{planet.title}</h4>
                    {planet.isChallenging && (
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-md uppercase tracking-widest-xl font-bold font-mono">
                            Deep Dive Area
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest-xl">
                        {completedSubtopics} / {totalSubtopics} Sectors secured
                    </span>
                    <span className="text-[var(--color-text-secondary)] transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
            </button>

            {/* Collapsible Content */}
            {isOpen && (
                <div className="p-6 flex flex-col gap-3 border-t border-white/5 bg-zinc-950/20">
                    {planet.subtopics.map((subtopic: any) => (
                        <SubtopicItem key={subtopic.id} subtopic={subtopic} />
                    ))}
                    {planet.subtopics.length === 0 && (
                        <p className="text-[10px] text-zinc-600 italic px-2 uppercase tracking-widest-xl font-mono">No modules deployed in this sector.</p>
                    )}
                </div>
            )}
        </div>
    );
}
