'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratorInput() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [roadmapTemplate, setRoadmapTemplate] = useState<any | null>(null);
    const [generationError, setGenerationError] = useState('');
    const [saveError, setSaveError] = useState('');
    const abortRef = React.useRef<AbortController | null>(null);
    const router = useRouter();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setRoadmapTemplate(null);
        setGenerationError('');

        // Create abort controller + 120s timeout
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
                signal: controller.signal,
            });

            const resData = await res.json();

            if (!res.ok) {
                // Read the precise error details sent from the server
                throw new Error(resData.details || resData.error || 'Failed to generate roadmap');
            }

            if (resData.roadmap) setRoadmapTemplate(resData.roadmap);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setGenerationError('Request timed out or was cancelled. Please try again.');
            } else {
                setGenerationError(err.message || 'AI generation failed. Please try again.');
            }
        } finally {
            clearTimeout(timeoutId);
            abortRef.current = null;
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        abortRef.current?.abort();
    };

    const handleSave = async () => {
        if (!roadmapTemplate) return;
        setIsSaving(true);
        setSaveError('');
        try {
            const res = await fetch('/api/roadmaps/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roadmapTemplate)
            });
            if (!res.ok) throw new Error('Failed to save roadmap');
            const data = await res.json();
            router.push(`/universe/${data.roadmapId}`);
        } catch (err: any) {
            setSaveError(err.message || 'Error saving roadmap. Please try again.');
            setIsSaving(false);
        }
    };

    const updateTitle = (newTitle: string) => setRoadmapTemplate({ ...roadmapTemplate, title: newTitle });

    const updateGalaxy = (gIndex: number, newTitle: string) => {
        const newGalaxies = [...roadmapTemplate.galaxies];
        newGalaxies[gIndex].title = newTitle;
        setRoadmapTemplate({ ...roadmapTemplate, galaxies: newGalaxies });
    };

    const updatePlanet = (gIndex: number, pIndex: number, newTitle: string) => {
        const newGalaxies = [...roadmapTemplate.galaxies];
        newGalaxies[gIndex].planets[pIndex].title = newTitle;
        setRoadmapTemplate({ ...roadmapTemplate, galaxies: newGalaxies });
    };

    const deletePlanet = (gIndex: number, pIndex: number) => {
        const newGalaxies = [...roadmapTemplate.galaxies];
        newGalaxies[gIndex].planets.splice(pIndex, 1);
        setRoadmapTemplate({ ...roadmapTemplate, galaxies: newGalaxies });
    };

    const updateSubtopic = (gIndex: number, pIndex: number, sIndex: number, newTitle: string) => {
        const newGalaxies = [...roadmapTemplate.galaxies];
        newGalaxies[gIndex].planets[pIndex].subtopics[sIndex].title = newTitle;
        setRoadmapTemplate({ ...roadmapTemplate, galaxies: newGalaxies });
    };

    const deleteSubtopic = (gIndex: number, pIndex: number, sIndex: number) => {
        const newGalaxies = [...roadmapTemplate.galaxies];
        newGalaxies[gIndex].planets[pIndex].subtopics.splice(sIndex, 1);
        setRoadmapTemplate({ ...roadmapTemplate, galaxies: newGalaxies });
    };

    // ─── Loading State: Active AI Core Animation ───────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 relative">
                <div className="relative w-32 h-32 mb-12">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />
                    {/* Middle Ring */}
                    <div className="absolute inset-4 rounded-full border border-cyan-500/10 border-b-cyan-500/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    {/* Core Pulse */}
                    <div className="absolute inset-[38%] rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" />
                    {/* Glow halo */}
                    <div className="absolute inset-8 rounded-full bg-cyan-500/10 animate-ping" />
                </div>

                <div className="text-center space-y-3 mb-10">
                    <p className="font-mono text-xs text-cyan-400 tracking-widest-xl uppercase animate-pulse">
                        Generating Your Roadmap
                    </p>
                    <p className="font-mono text-xs text-zinc-500 tracking-widest-xl">
                        Analyzing objective and building topic structure...
                    </p>
                </div>

                <button
                    onClick={handleCancel}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-mono uppercase tracking-widest-xl border border-white/5 hover:border-white/10 px-5 py-2 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // ─── Generation Form: AI Core Input Interface ──────────────────────────
    if (!roadmapTemplate) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 relative">
                {/* Header */}
                <div className="text-center mb-16 relative">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest-xl">AI Core Online</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 font-display">
                        Define Your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Directive</span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl leading-relaxed font-light">
                        Enter a learning objective. The AI Core will synthesize a structured mission roadmap calibrated to your cognitive profile.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="w-full max-w-2xl relative group">
                    {/* Input glow container */}
                    <div className="relative">
                        {/* Subtle ambient glow behind input - White/Zinc theme */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-transparent to-white/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />

                        <div className="relative bg-black/60 backdrop-blur-xl border border-white/5 group-focus-within:border-white/20 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl">
                            {/* Top accent bar */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-focus-within:via-cyan-500/30 transition-all duration-500" />

                            <div className="flex items-center gap-4 p-5">
                                {/* Terminal prompt character */}
                                <span className="font-mono text-cyan-500 text-xl shrink-0 select-none animate-pulse">›</span>

                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="What do you want to master? (e.g. 'Machine Learning Fundamentals')"
                                    className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-700 focus:outline-none text-lg font-light tracking-wide"
                                    disabled={isLoading}
                                    autoFocus
                                />

                                <button
                                    type="submit"
                                    disabled={!prompt.trim()}
                                    className="shrink-0 px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:bg-zinc-900 disabled:text-zinc-700 disabled:cursor-not-allowed"
                                >
                                    Synthesize
                                </button>
                            </div>

                            {/* Bottom accent bar */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-focus-within:via-cyan-500/20 transition-all duration-500" />
                        </div>
                    </div>

                    {/* Hint chips */}
                    <div className="flex flex-wrap gap-2 mt-5 justify-center">
                        {['Python Basics', 'React & Next.js', 'System Design', 'Data Structures'].map((hint) => (
                            <button
                                key={hint}
                                type="button"
                                onClick={() => setPrompt(hint)}
                                className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-cyan-500/30 hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 text-[10px] font-mono tracking-widest-xl uppercase rounded-lg transition-all duration-300"
                            >
                                {hint}
                            </button>
                        ))}
                    </div>

                    {/* Inline generation error */}
                    {generationError && (
                        <div className="mt-6 flex items-start gap-3 bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono px-5 py-4 rounded-xl">
                            <span className="text-rose-500 font-bold mt-0.5">[!]</span>
                            <div>
                                <div className="font-bold text-rose-400 mb-1 uppercase tracking-wider">Generation Failed</div>
                                <div className="text-rose-400/80">{generationError}</div>
                            </div>
                            <button onClick={() => setGenerationError('')} className="ml-auto text-rose-600 hover:text-rose-400 transition-colors">✕</button>
                        </div>
                    )}
                </form>
            </div>
        );
    }

    // ─── Editable Preview: Directive Configuration ─────────────────────────
    return (
        <div className="relative overflow-hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-8 border-b border-white/5 relative">
                <div className="absolute bottom-[-1px] left-0 w-24 h-px bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="font-mono text-xs text-emerald-500 tracking-widest-xl uppercase">Directive Ready — Review & Confirm</span>
                    </div>
                    <input
                        value={roadmapTemplate.title}
                        onChange={e => updateTitle(e.target.value)}
                        className="text-3xl md:text-4xl font-extrabold bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-cyan-500 focus:outline-none text-white w-full py-2 transition-colors duration-200 font-display"
                    />
                    {roadmapTemplate.rationale && (
                        <p className="text-zinc-400 text-sm mt-4 leading-relaxed font-light border-l-2 border-cyan-500/30 pl-4">{roadmapTemplate.rationale}</p>
                    )}
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    <button
                        onClick={() => setRoadmapTemplate(null)}
                        className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono tracking-widest-xl uppercase transition-colors"
                    >
                        Discard Sequence
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                        {isSaving ? 'Initializing...' : 'Deploy Mission →'}
                    </button>
                </div>
            </div>

            {/* Galaxy sections */}
            <div className="space-y-6">
                {roadmapTemplate.galaxies.map((galaxy: any, gIndex: number) => (
                    <div key={gIndex} className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-panel">
                        {/* Galaxy header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-5 border-b border-white/5 bg-zinc-900/40">
                            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                <input
                                    value={galaxy.title}
                                    onChange={e => updateGalaxy(gIndex, e.target.value)}
                                    className="font-extrabold text-white bg-transparent focus:outline-none border-b border-transparent focus:border-cyan-500/50 w-full text-[10px] uppercase tracking-widest-xl transition-all duration-300"
                                />
                            </div>
                            {galaxy.focus && (
                                <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-widest rounded border border-cyan-500/20 whitespace-nowrap">
                                    {galaxy.focus}
                                </span>
                            )}
                        </div>

                        {/* Planets */}
                        <div className="grid gap-3 p-5">
                            {galaxy.planets.map((planet: any, pIndex: number) => (
                                <div key={pIndex} className="bg-zinc-900/10 border border-white/5 rounded-xl p-4 relative group hover:border-white/10 transition-colors">
                                    <div className="flex flex-col gap-3 mb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/5 text-zinc-400 text-[10px] font-bold rounded border border-white/10 uppercase tracking-widest-xl shrink-0">
                                                    <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse" />
                                                    Calibrating Pattern
                                                </div>
                                                <input
                                                    value={planet.title}
                                                    onChange={e => updatePlanet(gIndex, pIndex, e.target.value)}
                                                    className="font-bold text-zinc-100 bg-transparent focus:outline-none border-b border-transparent focus:border-white/10 w-full text-sm transition-all duration-300"
                                                />
                                            </div>
                                            <button
                                                onClick={() => deletePlanet(gIndex, pIndex)}
                                                className="text-rose-500/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all px-2 text-sm shrink-0"
                                                title="Remove sector"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {planet.market_relevance && (
                                            <div className="text-xs text-emerald-500/80 bg-emerald-500/5 px-4 py-2.5 rounded-lg border border-emerald-500/10 lg:ml-[160px] mr-8">
                                                <span className="font-bold mr-2 text-emerald-400 shrink-0">MARKET INTEL:</span>
                                                <span className="font-light">{planet.market_relevance}</span>
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-3 pl-10 border-l border-white/5 ml-4">
                                        {planet.subtopics.map((subtopic: any, sIndex: number) => (
                                            <li key={sIndex} className="flex flex-col gap-1.5 group/sub">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0 group-hover/sub:bg-white/30 transition-colors" />
                                                    <input
                                                        value={subtopic.title}
                                                        onChange={e => updateSubtopic(gIndex, pIndex, sIndex, e.target.value)}
                                                        className="text-zinc-400 text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-white/5 flex-1 py-1 transition-all duration-300 font-light"
                                                    />
                                                    <button
                                                        onClick={() => deleteSubtopic(gIndex, pIndex, sIndex)}
                                                        className="text-rose-500/30 hover:text-rose-400 opacity-0 group-hover/sub:opacity-100 px-1 text-xs transition-all shrink-0"
                                                        title="Remove module"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                {(subtopic.description || (subtopic.key_tools && subtopic.key_tools.length > 0)) && (
                                                    <div className="ml-[22px] text-xs text-zinc-500/80 mb-2">
                                                        {subtopic.description && <p className="mb-2 font-light leading-relaxed max-w-2xl">{subtopic.description}</p>}
                                                        {subtopic.key_tools && subtopic.key_tools.length > 0 && (
                                                            <div className="flex gap-2 flex-wrap">
                                                                {subtopic.key_tools.map((tool: string, tIndex: number) => (
                                                                    <span key={tIndex} className="px-2 py-0.5 bg-white/5 text-zinc-300 rounded text-[9px] font-bold uppercase tracking-widest border border-white/10">
                                                                        {tool}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer save bar */}
            <div className="mt-12 pt-8 pb-4 border-t border-white/5 flex justify-end items-center gap-8">
                <button
                    onClick={() => setRoadmapTemplate(null)}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono tracking-widest-xl uppercase transition-colors"
                >
                    Discard Sequence
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                >
                    {isSaving ? 'Initializing...' : 'Deploy Mission →'}
                </button>
            </div>
        </div>
    );
}
