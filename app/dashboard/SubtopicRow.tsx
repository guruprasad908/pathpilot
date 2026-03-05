'use client';

import React, { useState } from 'react';

// Extract the types implicitly defined from Phase 2/3 SQL outputs
export default function SubtopicRow({ subtopic }: { subtopic: any }) {
    const [status, setStatus] = useState(subtopic.status || 'not_started');
    const [percentDone, setPercentDone] = useState(subtopic.percentDone || 0);
    const [isLoading, setIsLoading] = useState(false);

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
            } else {
                console.error('Failed to update progress');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isCompleted = status === 'completed';

    return (
        <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${isCompleted ? 'bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-zinc-900/20 border border-white/5 hover:border-white/10'
            }`}>
            <div className="flex items-center gap-3">
                {/* Simple Status Icon */}
                <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${isCompleted ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-zinc-700 text-transparent'
                    }`}>
                    {isCompleted && '✓'}
                </div>

                <span className={`text-sm font-medium tracking-wide transition-colors ${isCompleted ? 'text-emerald-300' : 'text-zinc-300'}`}>
                    {subtopic.title}
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Minimal Badge */}
                <span className={`text-[10px] px-3 py-1 rounded-lg font-mono tracking-widest-xl uppercase transition-colors ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800/40 text-zinc-500'
                    }`}>
                    {isCompleted ? 'Completed (100%)' : 'Not Started'}
                </span>

                {!isCompleted && (
                    <button
                        onClick={handleMarkComplete}
                        disabled={isLoading}
                        className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors ${isLoading
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                            : 'bg-white hover:bg-zinc-200 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                            }`}
                    >
                        {isLoading ? 'Saving...' : 'Mark Complete'}
                    </button>
                )}
            </div>
        </div>
    );
}
