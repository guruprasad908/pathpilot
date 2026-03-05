'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MissionLog({ initialRoadmaps }: { initialRoadmaps: any[] }) {
    const router = useRouter();
    const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [renameModal, setRenameModal] = useState<{ id: string, title: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSetActive = async (id: string) => {
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        setErrorMsg('');
        try {
            const res = await fetch(`/api/roadmaps/${id}/active`, { method: 'POST' });
            if (res.ok) {
                setRoadmaps(prev => prev.map(r => ({ ...r, is_active: r.id === id })));
                router.refresh();
            } else {
                setErrorMsg('Failed to set active roadmap. Please try again.');
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        const id = deleteModal;
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        setDeleteModal(null);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRoadmaps(prev => prev.filter(r => r.id !== id));
                router.refresh();
            } else {
                setErrorMsg('Failed to delete roadmap. Please try again.');
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameModal || !renameModal.title.trim()) return;
        const id = renameModal.id;
        const newTitle = renameModal.title;
        setLoadingMap(prev => ({ ...prev, [id]: true }));
        setRenameModal(null);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/roadmaps/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, title: newTitle } : r));
                router.refresh();
            } else {
                setErrorMsg('Failed to rename roadmap. Please try again.');
            }
        } finally {
            setLoadingMap(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="space-y-4 relative">

            {/* Inline error banner */}
            {errorMsg && (
                <div role="alert" className="flex items-center justify-between gap-3 bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono px-5 py-3 rounded-xl">
                    <span>[!] {errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} aria-label="Dismiss error" className="text-rose-600 hover:text-rose-400 transition-colors text-base leading-none">✕</button>
                </div>
            )}

            {roadmaps.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/10 backdrop-blur-md">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center shadow-lg">
                        <span className="text-4xl grayscale opacity-30">📚</span>
                    </div>
                    <p className="font-mono text-xs text-zinc-500 tracking-widest-xl uppercase mb-3">No mission log entries found</p>
                    <p className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase opacity-60 mb-10 max-w-xs mx-auto">Build your first AI roadmap to populate the archives.</p>
                    <Link
                        href="/builder"
                        className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 border border-white/20 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-white font-bold uppercase tracking-widest text-xs rounded transition-all duration-300"
                    >
                        Create First Roadmap →
                    </Link>
                </div>
            ) : (
                roadmaps.map((roadmap, idx) => (
                    <div
                        key={roadmap.id}
                        className={`relative bg-zinc-900/10 backdrop-blur-2xl border rounded-2xl p-6 md:p-8 shadow-panel overflow-hidden group transition-all duration-300 ${roadmap.is_active
                            ? 'border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]'
                            : 'border-white/5 hover:border-white/10'
                            }`}
                    >
                        {/* Active glow accent */}
                        {roadmap.is_active && (
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        )}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                            {/* Left: Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="font-mono text-xs text-zinc-600" aria-hidden="true">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </span>
                                    {roadmap.is_active && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white text-black text-[10px] font-bold rounded border border-white uppercase tracking-widest-xl">
                                            <span className="w-1 h-1 rounded-full bg-black animate-pulse" aria-hidden="true" />
                                            Active Protocol
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 group/title mb-4">
                                    <h3 className="text-xl font-bold text-white truncate">{roadmap.title}</h3>
                                    <button
                                        onClick={() => setRenameModal({ id: roadmap.id, title: roadmap.title })}
                                        aria-label={`Rename roadmap: ${roadmap.title}`}
                                        className="text-zinc-600 hover:text-white text-xs font-mono opacity-0 group-hover/title:opacity-100 transition-all duration-300 tracking-widest-xl uppercase shrink-0 min-h-[32px] px-3"
                                    >
                                        rename
                                    </button>
                                </div>

                                <div className="space-y-1.5 max-w-sm">
                                    <div className="flex justify-between items-center font-mono text-xs text-zinc-500 tracking-widest-xl uppercase">
                                        <span>Completion</span>
                                        <span className={roadmap.completion_percent > 0 ? 'text-white font-bold' : 'text-zinc-600'}>
                                            {roadmap.completion_percent}%
                                        </span>
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-valuenow={roadmap.completion_percent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${roadmap.title} completion: ${roadmap.completion_percent}%`}
                                        className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner"
                                    >
                                        <div
                                            className="h-full bg-gradient-to-r from-white/80 to-zinc-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                            style={{ width: `${roadmap.completion_percent}%` }}
                                        />
                                    </div>
                                    <div className="text-right text-[10px] text-zinc-600 font-mono tracking-widest-xl uppercase opacity-60">
                                        Created {new Date(roadmap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Controls — min 44px touch targets on all buttons */}
                            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                                <Link
                                    href={`/universe/${roadmap.id}`}
                                    aria-label={`Open roadmap: ${roadmap.title}`}
                                    className="flex-1 md:flex-none text-center px-5 py-3 bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold text-xs uppercase tracking-widest rounded transition-all duration-200 min-h-[44px] flex items-center justify-center border border-white"
                                >
                                    Open Path
                                </Link>

                                {!roadmap.is_active && (
                                    <button
                                        onClick={() => handleSetActive(roadmap.id)}
                                        disabled={loadingMap[roadmap.id]}
                                        aria-label={`Set "${roadmap.title}" as active roadmap`}
                                        className="flex-1 md:flex-none px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-xs uppercase tracking-widest rounded transition-all duration-200 disabled:opacity-40 min-h-[44px]"
                                    >
                                        {loadingMap[roadmap.id] ? '...' : 'Set Active'}
                                    </button>
                                )}

                                <button
                                    onClick={() => setDeleteModal(roadmap.id)}
                                    disabled={loadingMap[roadmap.id]}
                                    aria-label={`Delete roadmap: ${roadmap.title}`}
                                    className="px-5 py-3 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 font-bold text-[10px] uppercase tracking-widest-xl rounded-xl transition-all duration-300 disabled:opacity-40 min-h-[44px]"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* ─── Delete Confirmation Modal ─────────────────────────────── */}
            {deleteModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onKeyDown={(e) => e.key === 'Escape' && setDeleteModal(null)}
                >
                    <div className="relative bg-black/80 border border-rose-500/30 p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" aria-hidden="true" />
                            <span className="font-mono text-xs text-rose-500 uppercase tracking-widest-xl">Confirm Deletion</span>
                        </div>

                        <h3 id="delete-modal-title" className="text-xl font-bold text-white mb-3">Delete this roadmap?</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-10 font-light">
                            This roadmap and all its topics and progress will be permanently deleted. This cannot be undone.
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="px-6 py-3 text-zinc-500 hover:text-white text-[10px] font-mono tracking-widest-xl uppercase transition-all duration-300 min-h-[44px]"
                                autoFocus
                            >
                                Cancel Protocol
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all min-h-[44px]"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Rename Modal ─────────────────────────────── */}
            {renameModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rename-modal-title"
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onKeyDown={(e) => e.key === 'Escape' && setRenameModal(null)}
                >
                    <form onSubmit={handleRename} className="relative bg-zinc-900 border border-white/10 p-10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden backdrop-blur-2xl">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                            <span className="font-mono text-xs text-white uppercase tracking-widest">Rename Roadmap</span>
                        </div>

                        <label id="rename-modal-title" htmlFor="rename-input" className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest-xl mb-3">New Designation</label>
                        <input
                            id="rename-input"
                            type="text"
                            autoFocus
                            value={renameModal.title}
                            onChange={(e) => setRenameModal({ ...renameModal, title: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 focus:border-white/40 rounded-xl px-5 py-4 text-zinc-100 focus:outline-none mb-10 text-xl font-bold transition-all duration-300 font-display tracking-tight"
                        />
                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => setRenameModal(null)}
                                className="px-6 py-3 text-zinc-500 hover:text-white text-[10px] font-mono tracking-widest-xl uppercase transition-all duration-300 min-h-[44px]"
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all min-h-[44px]"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )
            }
        </div >
    );
}
