'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SubtopicItem({ subtopic }: { subtopic: any }) {
    const router = useRouter();
    const [status, setStatus] = useState(subtopic.status || 'not_started');
    const [percentDone, setPercentDone] = useState(subtopic.percentDone || 0);
    const [isLoading, setIsLoading] = useState(false);

    // Study session state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isStudying, setIsStudying] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(subtopic.totalTime || 0);

    // Format seconds to a readable string (e.g. 5m 30s)
    const formatTime = (seconds: number) => {
        if (!seconds) return '';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
    };

    const handleMarkComplete = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/progress/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtopic_id: subtopic.id,
                    status: 'completed',
                }),
            });

            if (res.ok) {
                setStatus('completed');
                setPercentDone(100);
                // Automatically end study session if they complete it while studying
                if (isStudying && sessionId) {
                    await handleEndStudy();
                }
            } else {
                console.error('Failed to update progress');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartStudy = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/study/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtopicId: subtopic.id }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessionId(data.sessionId);
                setIsStudying(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndStudy = async () => {
        if (!sessionId) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/study/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsStudying(false);
                setSessionId(null);
                setTotalSeconds((prev: number) => prev + data.durationSeconds);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isCompleted = status === 'completed';

    return (
        <li className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border transition-all duration-300 mb-3 overflow-hidden ${isCompleted
            ? 'bg-black/20 border-white/5 opacity-50'
            : 'bg-zinc-900/30 border-white/5 hover:border-cyan-500/30 shadow-panel hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]'
            }`}>
            <div className="flex items-center gap-[var(--spacing-sys-md)]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isStudying
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        : 'bg-zinc-900 border-white/10 text-zinc-600'
                    }`}>
                    {isCompleted ? '✓' : isStudying ? '⏱' : ''}
                </div>

                <div className="flex flex-col">
                    <span className={`font-semibold tracking-tight ${isCompleted ? 'text-zinc-500 line-through font-light' : 'text-zinc-100'}`}>
                        {subtopic.title}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                        {totalSeconds > 0 && (
                            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest-xl bg-zinc-900/50 px-2.5 py-1 rounded-md border border-white/5">
                                ⏳ {formatTime(totalSeconds)}
                            </span>
                        )}
                        {subtopic.isDeepDive && !isCompleted && (
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-md uppercase tracking-widest-xl font-bold font-mono">
                                Deep Dive Area
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-[var(--spacing-sys-sm)] self-start md:self-auto shrink-0">
                <button
                    onClick={() => router.push(`/practice/${subtopic.id}`)}
                    className="px-5 py-2.5 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900/50 border border-white/5 hover:border-cyan-500/50 rounded-lg transition-all duration-300 uppercase tracking-widest-xl flex items-center gap-2"
                >
                    Practice
                </button>

                {!isCompleted && !isStudying && (
                    <button
                        onClick={handleStartStudy}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-[10px] font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg transition-all duration-300 uppercase tracking-widest-xl"
                    >
                        Start Focus
                    </button>
                )}

                {!isCompleted && isStudying && (
                    <button
                        onClick={handleEndStudy}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-[10px] font-bold text-black bg-white hover:bg-zinc-200 rounded-lg transition-all duration-300 uppercase tracking-widest-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        End Focus
                    </button>
                )}

                {!isCompleted && (
                    <button
                        onClick={handleMarkComplete}
                        disabled={isLoading || isStudying}
                        className="px-5 py-2.5 text-[10px] font-bold text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-lg transition-all duration-300 uppercase tracking-widest-xl"
                    >
                        {isLoading && !isStudying ? '...' : 'Done'}
                    </button>
                )}
            </div>
        </li>
    );
}
