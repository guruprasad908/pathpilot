'use client';

import React, { useState, useEffect } from 'react';
import NavBar from '../../../components/NavBar';
import Link from 'next/link';

interface Problem {
    question: string;
    solution: string;
    explanation: string;
}

export default function PracticeClient({ subtopicId, subtopicTitle, roadmapId }: { subtopicId: string, subtopicTitle: string, roadmapId: string }) {
    const [difficulty, setDifficulty] = useState<string>('');
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});

    const generateSet = async () => {
        setIsLoading(true);
        setError('');
        setProblems([]);
        setRevealed({});
        setDifficulty('');

        try {
            const res = await fetch('/api/practice/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtopicId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate practice');
            }

            const data = await res.json();
            setDifficulty(data.difficulty);
            setProblems(data.problems);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateSet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtopicId]);

    const toggleReveal = (index: number) => {
        setRevealed(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className="min-h-screen font-display text-zinc-100 selection:bg-white/10 flex flex-col relative overflow-hidden">
            {/* Background elements are handled globally by layout.tsx, but we can add a localized terminal glow here */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <NavBar />

            <div className="w-full max-w-5xl mx-auto p-4 md:px-12 md:py-16 flex-1 flex flex-col relative z-10">
                <div className="mb-12 border-b border-white/5 pb-10 relative">
                    {/* Small accent dot */}
                    <div className="absolute bottom-[-1px] left-0 w-1 h-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />

                    <Link
                        href={roadmapId ? `/universe/${roadmapId}` : '/dashboard'}
                        className="text-zinc-500 hover:text-white mb-10 flex items-center gap-3 transition-colors text-xs font-mono tracking-widest-xl uppercase group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Map
                    </Link>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-md">
                        {subtopicTitle}
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest-xl font-bold">
                                Practice Mode
                            </span>
                        </div>

                        <div className="hidden sm:block text-zinc-800">/</div>

                        {difficulty && (
                            <div className="font-mono text-xs tracking-widest-xl text-white uppercase flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                <span className="text-zinc-600">Difficulty:</span> {difficulty}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-6 rounded-lg mb-8 shadow-lg font-mono text-sm flex items-start gap-4">
                        <span className="text-rose-500 font-bold mt-0.5">[!]</span>
                        <div className="flex-1">
                            <div className="font-bold text-rose-500 mb-1 uppercase tracking-wider">System Error</div>
                            <div>{error}</div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
                        <div className="relative flex items-center justify-center">
                            {/* Inner Spin */}
                            <div className="w-16 h-16 border border-white/20 border-t-white rounded-full animate-spin" />
                            {/* Outer Pulse */}
                            <div className="absolute inset-0 w-16 h-16 bg-white/5 rounded-full animate-ping blur-sm" />
                            {/* Center Dot */}
                            <div className="absolute w-2 h- dot bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
                        </div>
                        <div className="font-mono text-xs uppercase tracking-widest-xl text-white animate-pulse flex flex-col items-center gap-3">
                            <span>Generating Cognitive Challenges</span>
                            <span className="text-zinc-600">Calibrating to User Vectors...</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 flex-1">
                        {/* Question counter */}
                        {problems.length > 0 && (
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex gap-1.5">
                                    {problems.map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                    ))}
                                </div>
                                <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest-xl">
                                    {problems.length} questions in this set
                                </span>
                            </div>
                        )}
                        {problems.map((prob, idx) => (
                            <div key={idx} className="bg-zinc-900/10 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 shadow-panel relative group">
                                {/* Accent gradient border top */}
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent group-hover:via-white/20 transition-all duration-500" />

                                <div className="p-8 md:p-12">
                                    <div className="flex items-start gap-6 md:gap-10">
                                        <div className="text-zinc-700 font-mono text-sm mt-1 select-none flex flex-col items-center gap-2">
                                            <span className="text-[10px] uppercase tracking-widest-xl opacity-40 font-mono">ITEM</span>
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl md:text-2xl font-medium text-zinc-100 leading-relaxed mb-8">
                                                {prob.question}
                                            </h3>

                                            {!revealed[idx] ? (
                                                <button
                                                    onClick={() => toggleReveal(idx)}
                                                    className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-white text-xs font-mono font-bold tracking-widest-xl uppercase rounded flex-shrink-0 transition-all group/btn"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white group-hover/btn:shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                    Decrypt Answer
                                                </button>
                                            ) : (
                                                <div className="mt-10 pt-10 border-t border-white/5 space-y-10 animate-[slideUp_0.4s_ease-out_forwards]">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-xs uppercase tracking-widest-xl font-mono text-emerald-500 font-bold block">Unlocked Solution</span>
                                                        </div>
                                                        <p className="text-zinc-200 text-lg font-light leading-relaxed pl-5 border-l border-white/10 uppercase tracking-wide">{prob.solution}</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            <span className="text-xs uppercase tracking-widest-xl font-mono text-white font-bold block">Why This Works</span>
                                                        </div>
                                                        <p className="text-zinc-400 text-base leading-relaxed pl-5 border-l border-white/10 font-light">{prob.explanation}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {problems.length > 0 && (
                            <div className="pt-12 pb-8 flex justify-center relative">
                                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                                <button
                                    onClick={generateSet}
                                    className="relative group px-10 py-4 bg-zinc-900/50 border border-white/5 hover:border-white/40 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-widest-xl rounded-xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Hover sweep effect */}
                                    <div className="absolute inset-0 block w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Execute New Sequence
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
}
