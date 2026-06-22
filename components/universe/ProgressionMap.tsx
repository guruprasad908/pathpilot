'use client';

import React, { useState, MouseEvent, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingAstronaut from '../FloatingAstronaut';

export default function ProgressionMap({ roadmap, onSubtopicComplete }: { roadmap: any, onSubtopicComplete?: () => void }) {
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const nodeContainerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [activeSession, setActiveSession] = useState<{ id: string, subtopicId: string, startTime: number } | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Optimistic completion tracking — IDs that have been marked done this session
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [completingId, setCompletingId] = useState<string | null>(null);

    // Editing states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isAddingTopic, setIsAddingTopic] = useState(false);

    // Interaction states
    const [ripples, setRipples] = useState<{ id: string, x: number, y: number }[]>([]);
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const scrollStartX = useRef(0);
    const dragDistance = useRef(0);
    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    const [showScrollStart, setShowScrollStart] = useState(false);
    const [showScrollEnd, setShowScrollEnd] = useState(false);

    // Recursive Node Row for Mission Manifest
    const NodeRow = ({ node, index, depth = 0 }: { node: any, index: number, depth?: number }) => {
        const isSubActive = activeSession?.subtopicId === node.id;
        const isCompleted = node.status === 'completed' || completedIds.has(node.id);
        const isLocked = node.status === 'locked';
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className="space-y-3">
                <div
                    className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                        isCompleted ? 'bg-black/40 border-white/5' : 
                        isSubActive ? 'bg-cyan-500/5 border-cyan-500/30' : 
                        'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
                    }`}
                    style={{ marginLeft: `${depth * 20}px` }}
                >
                    <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row">
                        <div className="flex-1 min-w-0">
                            {editingId === node.id ? (
                                <div className="space-y-4 animate-[fadeUp_0.3s_ease-out]">
                                    <input
                                        autoFocus
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:border-cyan-500/50 outline-none"
                                        placeholder="Topic Title"
                                    />
                                    <textarea
                                        value={editDesc}
                                        onChange={e => setEditDesc(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-zinc-300 text-xs focus:border-cyan-500/50 outline-none h-20"
                                        placeholder="Description (optional)"
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleEditSave(node.id)}
                                            disabled={isSavingEdit}
                                            className="px-4 py-1.5 bg-cyan-500 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            {isSavingEdit ? '...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </span>
                                        <div className={`text-base font-bold ${isCompleted ? 'text-zinc-500' : 'text-zinc-100'}`}>
                                            {node.title}
                                            {hasChildren && <span className="ml-2 text-[10px] text-cyan-500/50 uppercase font-mono">[{node.children.length} Units]</span>}
                                        </div>
                                        <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingId(node.id);
                                                    setEditTitle(node.title);
                                                    setEditDesc(node.description || '');
                                                    setIsAddingTopic(false);
                                                }}
                                                className="text-[9px] font-mono text-zinc-600 hover:text-white uppercase"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNode(node.id)}
                                                className="text-[9px] font-mono text-rose-500/40 hover:text-rose-400 uppercase"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-3 md:mb-0 ml-7 ${isCompleted ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                        {node.description}
                                    </p>
                                </>
                            )}
                        </div>

                        {!editingId && node.isLeaf && (
                            <div className="flex items-center gap-3 self-end md:self-center">
                                {isSubActive ? (
                                    <button
                                        onClick={() => handleEndStudy(node.id)}
                                        className="h-10 px-4 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl text-xs font-mono font-bold flex items-center justify-center animate-pulse transition-all"
                                    >
                                        {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                                    </button>
                                ) : isCompleted ? (
                                    <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/60 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span>Mission Clear</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleMarkComplete(node.id)}
                                            className="px-6 py-2 bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Done
                                        </button>
                                        <button
                                            onClick={() => handleStartStudy(node.id)}
                                            className="px-6 py-2 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Engage
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Recursive Children Rendering */}
                {hasChildren && (
                    <div className="ml-4 border-l border-white/5 pl-4 space-y-3">
                        {node.children.map((child: any, cIdx: number) => (
                            <NodeRow key={child.id} node={child} index={cIdx} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Timer effect for active study session
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeSession) {
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    const handleStartStudy = async (subtopicId: string) => {
        try {
            const res = await fetch('/api/study/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtopicId })
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSession({ id: data.sessionId, subtopicId, startTime: Date.now() });
                setElapsedSeconds(0);
            }
        } catch (e) { console.error('Failed to start session'); }
    };

    const handleEndStudy = async (subtopicId: string) => {
        if (!activeSession) return;
        try {
            await fetch('/api/study/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: activeSession.id, durationSeconds: elapsedSeconds })
            });
            setActiveSession(null);
            setElapsedSeconds(0);
        } catch (e) { console.error('Failed to end session'); }
    };

    const handleMarkComplete = async (subtopicId: string) => {
        if (completedIds.has(subtopicId) || completingId) return;
        setCompletingId(subtopicId);

        // Optimistically update local state IMMEDIATELY for instant UI feedback
        setCompletedIds(prev => new Set([...prev, subtopicId]));
        setSelectedNode((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                subtopics: prev.subtopics?.map((s: any) =>
                    s.id === subtopicId ? { ...s, status: 'completed' } : s
                ),
                children: prev.children?.map((c: any) =>
                    c.id === subtopicId ? { ...c, status: 'completed' } : c
                )
            };
        });

        try {
            const res = await fetch(`/api/subtopics/${subtopicId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                // Notify parent to refresh the roadmap data (updates node glow colors on map)
                onSubtopicComplete?.();
            } else {
                const err = await res.json();
                console.error('Failed to mark complete:', err.error);
                // Note: Realistically we would revert the optimistic update here if needed
            }
        } catch (e) {
            console.error('Failed to mark complete:', e);
        } finally {
            setCompletingId(null);
        }
    };

    const handleEditSave = async (id: string) => {
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/nodes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, description: editDesc })
            });
            if (res.ok) {
                // Update local state
                setSelectedNode((prev: any) => ({
                    ...prev,
                    subtopics: prev.subtopics.map((s: any) => s.id === id ? { ...s, title: editTitle, description: editDesc } : s)
                }));
                setEditingId(null);
                onSubtopicComplete?.();
            }
        } catch (e) {
            console.error('Edit failed', e);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteNode = async (id: string) => {
        if (!confirm('Are you sure you want to remove this topic and all its contents?')) return;
        try {
            const res = await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedNode((prev: any) => ({
                    ...prev,
                    subtopics: prev.subtopics.filter((s: any) => s.id !== id)
                }));
                onSubtopicComplete?.();
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const handleAddNode = async () => {
        if (!editTitle.trim()) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch('/api/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roadmapId: roadmap.id,
                    parentId: selectedNode.id,
                    title: editTitle,
                    description: editDesc
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedNode((prev: any) => ({
                    ...prev,
                    subtopics: [...(prev.subtopics || []), {
                        id: data.nodeId,
                        title: editTitle,
                        description: editDesc,
                        status: 'unlocked'
                    }]
                }));
                setIsAddingTopic(false);
                setEditTitle('');
                setEditDesc('');
                onSubtopicComplete?.();
            }
        } catch (e) {
            console.error('Add failed', e);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragDistance.current = 0;
        dragStartX.current = e.pageX;
        scrollStartX.current = scrollContainerRef.current?.scrollLeft || 0;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;

        const dx = e.pageX - dragStartX.current;
        dragDistance.current = Math.abs(dx);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollStartX.current - dx;
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        dragDistance.current = 0;
        dragStartX.current = e.touches[0].pageX;
        scrollStartX.current = scrollContainerRef.current?.scrollLeft || 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const dx = e.touches[0].pageX - dragStartX.current;
        dragDistance.current = Math.abs(dx);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollStartX.current - dx;
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };



    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            // Show start button if we've scrolled more than 300px from the far left
            setShowScrollStart(scrollLeft > 300);
            // Show end button if we have more than 300px of scrollable space remaining to the right
            setShowScrollEnd(scrollLeft + clientWidth < scrollWidth - 300);
        }
    };

    const scrollToStart = () => {
        if (scrollContainerRef.current) {
            const firstNode = scrollContainerRef.current.querySelector('[data-index="0"]');
            if (firstNode) {
                firstNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    };

    const scrollToEnd = () => {
        if (scrollContainerRef.current && nodes.length > 0) {
            const lastNode = scrollContainerRef.current.querySelector(`[data-index="${nodes.length - 1}"]`);
            if (lastNode) {
                lastNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'smooth' });
            }
        }
    };

    // Constellation Geometry Logic
    const nodes = useMemo(() => {
        const sequence: any[] = [];
        if (!roadmap || !roadmap.children) return [];

        const flattenedSectors: any[] = [];
        
        // Roadmap children are Sectors/Galaxies
        roadmap.children.forEach((sector: any) => {
            if (sector.children) {
                // Sector children are Planets
                sector.children.forEach((planet: any, pIndex: number) => {
                    const subtopics = planet.children || [];
                    
                    let status: 'locked' | 'in_progress' | 'completed' = 'locked';

                    if (subtopics.length > 0) {
                        const allCompleted = subtopics.every((s: any) => s.status === 'completed');
                        const anyStarted = subtopics.some((s: any) => s.status === 'in_progress' || s.status === 'completed');

                        if (allCompleted) status = 'completed';
                        else if (anyStarted) status = 'in_progress';
                    } else {
                        status = planet.status || 'locked';
                    }

                    flattenedSectors.push({
                        ...planet,
                        calcStatus: status,
                        milestoneTitle: pIndex === 0 ? sector.title : null,
                        subtopics: subtopics
                    });
                });
            }
        });

        const SPACING_X = isMobile ? 220 : 400;
        const VARIANCE_Y = isMobile ? 80 : 150; 
        const DEPTH_RANGE = 100;

        flattenedSectors.forEach((p: any, globalIndex: number) => {
            const seed = globalIndex * 137.5;
            const offsetX = globalIndex * SPACING_X;
            const offsetY = (Math.sin(seed) * VARIANCE_Y);
            const offsetZ = (Math.cos(seed) * DEPTH_RANGE);

            sequence.push({
                ...p,
                coords: {
                    x: offsetX,
                    y: 400 + offsetY, 
                    z: offsetZ
                },
                globalIndex
            });
        });

        // Determine current "active" node (the next one in line)
        let currentFound = false;
        sequence.forEach((n) => {
            if (!currentFound && (n.calcStatus === 'locked' || n.calcStatus === 'in_progress' || n.calcStatus === 'not_started')) {
                n.isCurrent = true;
                currentFound = true;
                if (n.calcStatus === 'locked' || n.calcStatus === 'not_started') n.calcStatus = 'in_progress';
            } else {
                n.isCurrent = false;
            }
            if (n.calcStatus === 'not_started') n.calcStatus = 'locked';
        });

        return sequence;
    }, [roadmap]);

    // Cinematic Scroll to center active node on load
    useEffect(() => {
        if (!scrollContainerRef.current || nodes.length === 0) return;

        const timer = setTimeout(() => {
            const activeNode = nodes.find(n => n.isCurrent) || nodes[0];
            if (activeNode && scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                    left: activeNode.coords.x,
                    behavior: 'smooth'
                });
            }
            handleScroll();
        }, 800);

        return () => clearTimeout(timer);
        // Only run when roadmap changes, not when offsets change
    }, [roadmap?.id]);

    // ─── Mobile List View ─────────────────────────────────────────────────
    if (isMobile) {
        // Group nodes by category title for section headers
        const galaxySections = roadmap.children.map((g: any) => ({
            title: g.title,
            planets: nodes.filter((n: any) => n.milestoneTitle !== null || g.children?.some((p: any) => p.id === n.id)).filter((n: any) => g.children?.some((p: any) => p.id === n.id))
        }));

        return (
            <div className="flex flex-col h-screen relative">
                {/* Fixed HUD Button for Mobile */}
                <div className="fixed top-[72px] right-4 z-50 animate-[fadeIn_0.5s_ease-out_forwards]">
                    <a
                        href={roadmap.tutorialVideoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(roadmap.title)}+full+course+playlist`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 flex items-center justify-center bg-black/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-95 transition-all"
                    >
                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                    </a>
                </div>
                {/* Scrollable planet list */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-4">
                    {/* Mastery Briefing Mobile Card - ALWAYS VISIBLE WITH FALLBACK */}
                    <div className="mb-6 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl animate-[fadeUp_0.5s_ease-out]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono text-red-500 uppercase tracking-[0.2em] mb-1 font-bold">
                                    {roadmap.tutorialVideoUrl ? 'Mastery Briefing' : 'Mastery Discovery'}
                                </div>
                                <div className="text-sm font-bold text-white truncate">
                                    {roadmap.tutorialVideoTitle || 'Full YouTube Course'}
                                </div>
                            </div>
                            <a 
                                href={roadmap.tutorialVideoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(roadmap.title)}+full+course+playlist`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                            >
                                Play
                            </a>
                        </div>
                    </div>
                    {galaxySections.map((section: any, si: number) => (
                        <section key={si}>
                            {/* Galaxy header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest shrink-0 px-2">
                                    {section.title}
                                </span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            {/* Planet cards */}
                            <div className="space-y-3">
                                {section.planets.map((node: any, ni: number) => {
                                    const statusColor =
                                        node.calcStatus === 'completed' ? 'border-emerald-500/40 bg-emerald-500/5' :
                                            node.calcStatus === 'in_progress' ? 'border-cyan-500/40 bg-cyan-500/5' :
                                                'border-white/10 bg-zinc-900/40 opacity-50';
                                    const dotColor =
                                        node.calcStatus === 'completed' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' :
                                            node.calcStatus === 'in_progress' ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse' :
                                                'bg-zinc-800';
                                    const statusLabel =
                                        node.calcStatus === 'completed' ? '✓ Done' :
                                            node.calcStatus === 'in_progress' ? node.isCurrent ? '▶ Current' : 'In Progress' :
                                                '🔒 Locked';
                                    const statusLabelColor =
                                        node.calcStatus === 'completed' ? 'text-emerald-400' :
                                            node.calcStatus === 'in_progress' ? 'text-cyan-400' :
                                                'text-zinc-600';

                                    return (
                                        <button
                                            key={node.id}
                                            type="button"
                                            aria-label={`Open ${node.title}`}
                                            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                                            className={`w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${statusColor} ${selectedNode?.id === node.id ? 'ring-1 ring-cyan-500/30' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-sm text-zinc-100 truncate leading-tight">{node.title}</div>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        {node.subtopics?.map((sub: any, sIdx: number) => {
                                                            let sColor = "bg-zinc-800";
                                                            if (sub.status === 'completed') sColor = "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]";
                                                            else if (sub.status === 'in_progress') sColor = "bg-cyan-500 shadow-[0_0_4px_rgba(34,211,238,0.8)]";
                                                            return <div key={sIdx} className={`w-1.5 h-1.5 rounded-full ${sColor}`} />
                                                        })}
                                                        <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase ml-1">
                                                            {node.subtopics?.length || 0} topic{node.subtopics?.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-mono uppercase tracking-widest shrink-0 ${statusLabelColor}`}>
                                                {statusLabel}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Terminal panel — same as desktop, slides up from bottom */}
                {selectedNode && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-0 animate-[slideUp_0.4s_ease-out_forwards]">
                        <div className="max-w-4xl mx-auto bg-black/90 backdrop-blur-xl border border-b-0 border-white/5 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                            <div className="p-4 md:p-6 pb-8">
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    aria-label="Close panel"
                                    className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <span aria-hidden="true">✕</span>
                                </button>

                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-bold text-white tracking-tight font-display">{selectedNode.title}</h3>
                                    <span className={`px-2.5 py-1 text-xs uppercase tracking-widest font-bold rounded ${selectedNode.calcStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        selectedNode.calcStatus === 'in_progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                            'bg-zinc-800/50 text-zinc-500 border border-white/5'
                                        }`}>
                                        {selectedNode.calcStatus.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="grid gap-2 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar pb-2 mt-4">
                                    {selectedNode.subtopics?.map((sub: any, idx: number) => {
                                        const isSubActive = activeSession?.subtopicId === sub.id;
                                        return (
                                            <div key={sub.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono text-xs text-zinc-600 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                                                        <span className="font-medium text-zinc-200 text-sm leading-snug">{sub.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {/* STUDY Focus Timer */}
                                                        {sub.status === 'locked' ? null : isSubActive ? (
                                                            <button
                                                                onClick={() => handleEndStudy(sub.id)}
                                                                className="h-8 px-3 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center animate-pulse transition-all"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />
                                                                {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleStartStudy(sub.id)}
                                                                disabled={activeSession !== null}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-transparent text-zinc-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                aria-label="Start Focus Timer"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {/* DONE Button */}
                                                        {sub.status !== 'locked' && (
                                                            <button 
                                                                onClick={() => sub.status !== 'completed' && handleMarkComplete(sub.id)}
                                                                disabled={completingId !== null || sub.status === 'completed'}
                                                                className={`h-8 px-3 md:px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 border ${
                                                                    sub.status === 'completed' ? 'bg-transparent text-emerald-500/50 border-emerald-500/20 cursor-default' :
                                                                    'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40'
                                                                }`}
                                                            >
                                                                {completingId === sub.id ? (
                                                                    <span className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <span className="text-sm leading-none">✓</span>
                                                                )}
                                                                Done
                                                            </button>
                                                        )}

                                                        {/* PRACTICE Button */}
                                                        {sub.status !== 'locked' && (
                                                            <button 
                                                                onClick={() => router.push(`/practice/${sub.id}`)}
                                                                className={`h-8 px-3 md:px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                                    sub.status === 'completed' ? 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20 hover:text-white' :
                                                                    'bg-transparent text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50'
                                                                }`}
                                                            >
                                                                Practice
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {sub.description && (
                                                    <p className="text-xs text-zinc-500 font-light leading-relaxed mt-2 ml-7">
                                                        {sub.description}
                                                    </p>
                                                )}
                                                {sub.concepts_to_master && sub.concepts_to_master.length > 0 && (
                                                    <div className="mt-2 ml-7 space-y-1 border-l border-cyan-500/20 pl-3">
                                                        <div className="text-[9px] font-mono text-cyan-500/60 uppercase tracking-widest mb-1">Concepts to Master</div>
                                                        {sub.concepts_to_master.map((concept: string, cIdx: number) => (
                                                            <div key={cIdx} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                                                                <span className="text-cyan-500/50 mt-0.5 shrink-0">·</span>
                                                                <span className="leading-snug">{concept}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Desktop Canvas View ───────────────────────────────────────────────
    return (
        <div
            className="w-full h-full relative border-0 bg-transparent"
        >
            {/* Tutorial HUD Button - FIXED POSITION */}
            <div className="fixed top-[72px] md:top-24 right-4 md:right-8 z-50 animate-[fadeIn_0.5s_ease-out_forwards]">
                <a
                    href={roadmap.tutorialVideoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(roadmap.title)}+full+course+playlist`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2 md:py-3 bg-black/90 backdrop-blur-xl border border-red-500/30 hover:border-red-500 rounded-2xl transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.8)] hover:-translate-y-1"
                >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center group-hover:bg-red-500/30 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <div className="text-[9px] md:text-[10px] font-mono text-red-500 uppercase tracking-widest leading-none mb-1 font-bold">
                            {roadmap.tutorialVideoUrl ? 'Mastery Briefing' : 'Mastery Discovery'}
                        </div>
                        <div className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider max-w-[120px] md:max-w-[200px] truncate">
                            {roadmap.tutorialVideoTitle || 'Find Full Course'}
                        </div>
                    </div>
                </a>
            </div>
            <div
                className="relative w-full h-full border-0 bg-black/95"
            >
                {/* Simplified Deep Space Background & Astronaut (Behind Map) */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Dark gradient overlay to blend stars */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/80 to-black z-10" />

                    {/* Faint Stars Container */}
                    <div className="absolute inset-0 opacity-40">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div
                                key={`star-${i}`}
                                className="absolute rounded-full bg-white animate-pulse"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: Math.random() > 0.8 ? '2px' : '1px',
                                    height: Math.random() > 0.8 ? '2px' : '1px',
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 4}s`
                                }}
                            />
                        ))}
                    </div>

                    <div className="z-10 absolute inset-0">
                        <FloatingAstronaut delay={0} startX="15%" startY="10%" scale={0.6} duration={90} />
                    </div>
                </div>

                {/* Scrollable Universe Area */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="absolute inset-0 overflow-x-auto overflow-y-auto hide-scrollbar cursor-grab"
                    style={{
                        padding: '0 50vw',
                        perspective: '1200px'
                    }}
                >
                    <div
                        ref={nodeContainerRef}
                        className="relative h-[800px] flex items-center"
                        style={{
                            width: `${Math.max(window.innerWidth, (nodes.length) * (isMobile ? 220 : 400) + 1000)}px`,
                            transformStyle: 'preserve-3d',
                            transform: 'rotateX(55deg)',
                            transformOrigin: 'center center'
                        }}
                    >
                        {/* Neural Connectors SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <filter id="neural-glow">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            {nodes.map((node, i) => {
                                if (i === 0) return null;
                                const prev = nodes[i - 1];
                                const isLinkActive = prev.calcStatus === 'completed';

                                const x1 = prev.coords.x + 50;
                                const y1 = prev.coords.y + 50;
                                const x2 = node.coords.x + 50;
                                const y2 = node.coords.y + 50;

                                const cp1x = x1 + (x2 - x1) * 0.5;
                                const cp2x = x1 + (x2 - x1) * 0.5;
                                const pathData = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

                                return (
                                    <g key={`link-${i}`}>
                                        {/* Base Faint Line */}
                                        <path
                                            d={pathData}
                                            stroke="rgba(255, 255, 255, 0.05)"
                                            strokeWidth="1"
                                            fill="none"
                                        />
                                        
                                        {/* Active Laser Flow */}
                                        {isLinkActive && (
                                            <>
                                                <path
                                                    d={pathData}
                                                    stroke="rgba(34, 211, 238, 0.3)"
                                                    strokeWidth="3"
                                                    fill="none"
                                                    filter="url(#neural-glow)"
                                                />
                                                {/* Animated Data Packet (Moving Energy Orb) */}
                                                <path
                                                    d={pathData}
                                                    stroke="rgba(34, 211, 238, 0.9)"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    style={{ animation: 'dataPacket 3s linear infinite' }}
                                                    strokeDasharray="25, 1500"
                                                    filter="url(#neural-glow)"
                                                />
                                            </>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Ambient Sector Glow */}
                        {nodes.find(n => n.isCurrent) && (
                            <div
                                className="absolute w-[800px] h-[800px] rounded-full pointer-events-none transition-all duration-1000 ease-in-out"
                                style={{
                                    left: (nodes.find(n => n.isCurrent)?.coords.x || 0) + 50 - 400,
                                    top: (nodes.find(n => n.isCurrent)?.coords.y || 0) + 50 - 400,
                                    background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, rgba(0,0,0,0) 70%)',
                                    zIndex: 0
                                }}
                            />
                        )}

                        {/* Empty results indicator */}
                        {nodes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest-xl">
                                    [!] No trajectory nodes detected in this sector
                                </span>
                            </div>
                        )}

                        {/* Node Render Loop */}
                        {nodes.map((node, i) => {
                            const isLocked = node.calcStatus === 'locked';
                            const isCurrent = node.isCurrent;
                            const isCompleted = node.calcStatus === 'completed';

                            return (
                                <div
                                    key={node.id}
                                    data-index={i}
                                    data-current={isCurrent}
                                    className="absolute"
                                    style={{
                                        left: `${node.coords.x}px`,
                                        top: `${node.coords.y}px`,
                                        transform: `translate3d(0, 0, ${node.coords.z}px) rotateX(-55deg)`,
                                        transformStyle: 'preserve-3d',
                                        transformOrigin: 'bottom center',
                                        zIndex: 20
                                    }}
                                >
                                    {/* Milestone Header */}
                                    {node.milestoneTitle && (
                                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold tracking-[0.4em] text-zinc-400 uppercase border-b border-white/10 pb-2">
                                            {node.milestoneTitle}
                                        </div>
                                    )}

                                    {/* The Node Body */}
                                    <div
                                        onClick={(e) => {
                                            if (dragDistance.current > 5) return;

                                            // Handle Ripple
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;
                                            const newRippleId = Date.now().toString();
                                            setRipples(prev => [...prev, { id: newRippleId, x, y }]);
                                            setTimeout(() => {
                                                setRipples(prev => prev.filter(r => r.id !== newRippleId));
                                            }, 1000);

                                            setSelectedNode(selectedNode?.id === node.id ? null : node);
                                        }}
                                        className={`group relative w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-500 select-none hover:bg-white/5 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'
                                            }`}
                                    >
                                        {/* Interaction Ripples */}
                                        {ripples.map(r => (
                                            <div
                                                key={r.id}
                                                className="absolute rounded-full bg-cyan-400/30 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_forwards] pointer-events-none"
                                                style={{ left: r.x - 20, top: r.y - 20, width: 40, height: 40 }}
                                            />
                                        ))}

                                        {/* 1. Ambient Field (Base Layer) */}
                                        <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isCurrent ? 'bg-cyan-500/20 blur-2xl animate-pulse' :
                                            isCompleted ? 'bg-emerald-500/10 blur-xl' : ''
                                            }`} />

                                        {/* 2. Rotating Orbital Ring (Outer Detail) */}
                                        {!isLocked && (
                                            <svg className={`absolute -inset-4 w-[132px] h-[132px] pointer-events-none transition-opacity duration-1000 opacity-50 animate-spin ${isCurrent ? '[animation-duration:4s]' : '[animation-duration:20s]'
                                                }`} viewBox="0 0 100 100">
                                                <circle
                                                    cx="50" cy="50" r="48"
                                                    fill="none"
                                                    stroke={isCurrent ? "rgba(34,211,238,0.4)" : "rgba(16,185,129,0.3)"}
                                                    strokeWidth="1"
                                                    strokeDasharray="4 8 20 4"
                                                    className="origin-center"
                                                />
                                            </svg>
                                        )}

                                        {/* Technical Crosshairs */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 -translate-x-1/2 -my-2" />
                                            <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5 -translate-y-1/2 -mx-2" />
                                        </div>

                                        {/* 3. The Planetary Sphere (CSS 3D illusion) */}
                                        <div className={`absolute inset-0 rounded-full overflow-hidden transition-all duration-700 border ${
                                            isCurrent ? 'shadow-[0_0_40px_rgba(34,211,238,0.3),_inset_-15px_-15px_30px_rgba(0,0,0,0.8),_inset_5px_5px_20px_rgba(255,255,255,0.2)] border-cyan-500/50' :
                                            isCompleted ? 'shadow-[0_0_20px_rgba(16,185,129,0.2),_inset_-15px_-15px_30px_rgba(0,0,0,0.8),_inset_5px_5px_20px_rgba(255,255,255,0.2)] border-emerald-500/30' : 
                                            'shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.9),_inset_5px_5px_20px_rgba(255,255,255,0.1)] border-white/10'
                                            }`}
                                        >
                                            {/* Rotating Texture Background */}
                                            <div 
                                                className="absolute inset-0 w-[200%] h-full opacity-40 mix-blend-screen"
                                                style={{
                                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)`,
                                                    backgroundSize: '100px 100%',
                                                    animation: 'planetRotate 20s linear infinite'
                                                }}
                                            />
                                            {/* Base Core Color */}
                                            <div className={`absolute inset-0 w-full h-full mix-blend-overlay ${
                                                isCurrent ? 'bg-cyan-500/40' :
                                                isCompleted ? 'bg-emerald-500/30' : 
                                                'bg-zinc-600/20'
                                            }`} />
                                        </div>

                                        {/* 4. Planetary Atmosphere Halo */}
                                        {(isCurrent || isCompleted) && (
                                            <div className={`absolute -inset-1 rounded-full pointer-events-none transition-opacity duration-1000 mix-blend-screen ${
                                                isCurrent ? 'bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(34,211,238,0.4)_100%)] opacity-80' : 
                                                'bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(16,185,129,0.3)_100%)] opacity-50'
                                            }`} />
                                        )}

                                        {/* Unified Telemetry & Title Label */}
                                        <div className="absolute top-[125px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500 w-max max-w-[220px] text-center">
                                            {/* Connector line from node to text */}
                                            <div className={`w-px h-6 mb-2 bg-gradient-to-b ${isCurrent ? 'from-cyan-500/50' : 'from-white/20'} to-transparent`} />

                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[10px] font-mono tracking-widest uppercase ${isCurrent ? 'text-cyan-500/80' : 'text-zinc-500'}`}>
                                                    ID-{(i + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span className="font-mono text-[9px] text-zinc-600 tracking-tighter">
                                                    SEC:{node.coords.x.toFixed(0)} / V:{node.coords.y.toFixed(0)}
                                                </span>
                                            </div>

                                            <div className={`text-[13px] font-bold leading-tight uppercase tracking-widest ${isCurrent ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]' :
                                                isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                                                }`}>
                                                {node.title}
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Navigation Controls */}
            {!selectedNode && !isMobile && (
                <>
                    {showScrollStart && (
                        <div className="absolute bottom-8 left-8 z-40 animate-[fadeIn_0.3s_ease-out_forwards]">
                            <button
                                onClick={scrollToStart}
                                className="group flex items-center gap-3 px-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                            >
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                                    <span className="text-zinc-400 group-hover:text-cyan-400 rotate-180 transition-colors">→</span>
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] tracking-widest-xl font-mono text-zinc-500 uppercase tracking-widest-xl leading-none mb-1">Jump to</div>
                                    <div className="text-xs font-bold text-zinc-200 uppercase tracking-widest-xl">Start of Path</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {showScrollEnd && (
                        <div className="absolute bottom-8 right-8 z-40 animate-[fadeIn_0.3s_ease-out_forwards]">
                            <button
                                onClick={scrollToEnd}
                                className="group flex items-center gap-3 px-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                            >
                                <div className="text-right">
                                    <div className="text-[10px] tracking-widest-xl font-mono text-zinc-500 uppercase tracking-widest-xl leading-none mb-1">Explore</div>
                                    <div className="text-xs font-bold text-zinc-200 uppercase tracking-widest-xl">End of Path</div>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                                    <span className="text-zinc-400 group-hover:text-cyan-400 transition-colors">→</span>
                                </div>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ─── Tactical Sci-Fi HUD Modal ─────────────────────────────── */}
            {selectedNode && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-md"
                    style={{ animation: 'manifestFadeIn 0.3s ease-out forwards' }}
                    onClick={() => setSelectedNode(null)}
                >
                    <div
                        className="w-full max-w-4xl max-h-[90vh] bg-[#030303]/95 border border-cyan-500/20 rounded-3xl shadow-[0_0_150px_rgba(34,211,238,0.1)] relative overflow-hidden flex flex-col"
                        style={{ animation: 'manifestScaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Futuristic Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        
                        {/* Scanning Line Overlay */}
                        <div className="absolute inset-0 w-full h-[150px] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent blur-[4px] pointer-events-none animate-[scanline_6s_linear_infinite]" />

                        {/* Tech Borders */}
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-500/50 rounded-br-3xl pointer-events-none" />

                        {/* Top Energy Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)]" />

                        <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/5 text-cyan-500/60 hover:text-cyan-400 transition-all border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:rotate-90 z-20"
                                aria-label="Close panel"
                            >
                                <span className="text-xl leading-none">✕</span>
                            </button>

                            {/* Header */}
                            <div className="mb-8 pr-12 relative">
                                <div className="absolute left-[-2rem] top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/80 to-transparent rounded-r" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-2 h-2 rounded-[2px] rotate-45 ${selectedNode.calcStatus === 'completed'
                                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                        : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse'
                                        }`} />
                                    <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-500/80 font-bold">
                                        Tactical Overlay // {selectedNode.calcStatus.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                    {selectedNode.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed font-mono max-w-2xl mb-8">
                                    <span className="text-cyan-500/50 mr-2">{'>'}</span>
                                    {selectedNode.description || `Awaiting manual sequence execution for ${selectedNode.title}. All sub-protocols must be verified to complete the sector jump.`}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-white/5">
                                    <button
                                        onClick={() => {
                                            setIsAddingTopic(true);
                                            setEditTitle('');
                                            setEditDesc('');
                                            setEditingId(null);
                                        }}
                                        className="group relative px-6 py-2.5 bg-black hover:bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            <span className="text-lg leading-none mb-0.5">+</span> Add Sub-Protocol
                                        </span>
                                    </button>
                                </div>

                                {/* Tutorial Shortcut in Modal */}
                                {roadmap.tutorialVideoUrl && (
                                    <div className="flex items-center gap-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl mb-2 group/vid">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                                            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest mb-0.5">Mastery Briefing</div>
                                            <div className="text-xs font-bold text-zinc-100 truncate">{roadmap.tutorialVideoTitle || 'Featured Tutorial'}</div>
                                        </div>
                                        <a 
                                            href={roadmap.tutorialVideoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Watch Now
                                        </a>
                                    </div>
                                )}
                            </div>

                                <div className="space-y-4">
                                    {isAddingTopic && (
                                        <div className="p-6 rounded-lg border border-cyan-500/40 bg-cyan-950/20 mb-6 animate-[fadeUp_0.3s_ease-out] relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                                            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                Initialize New Sequence
                                            </div>
                                            <div className="space-y-4">
                                                <input
                                                    autoFocus
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    className="w-full bg-black/60 border border-cyan-500/20 rounded px-4 py-3 text-white font-mono text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all placeholder-zinc-700"
                                                    placeholder="[ SEQUENCE_IDENTIFIER ]"
                                                />
                                                <textarea
                                                    value={editDesc}
                                                    onChange={e => setEditDesc(e.target.value)}
                                                    className="w-full bg-black/60 border border-cyan-500/20 rounded px-4 py-3 text-zinc-400 font-mono text-xs focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none h-24 transition-all placeholder-zinc-700"
                                                    placeholder="> Enter protocol parameters..."
                                                />
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handleAddNode}
                                                        disabled={isSavingEdit || !editTitle.trim()}
                                                        className="px-6 py-2.5 bg-cyan-500 text-black hover:bg-cyan-400 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? 'Executing...' : 'Commit Sequence'}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAddingTopic(false)}
                                                        className="px-6 py-2.5 bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                                                    >
                                                        Abort
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedNode.children?.map((child: any, idx: number) => (
                                        <NodeRow key={child.id} node={child} index={idx} depth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
            )}

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }

                @keyframes manifestFadeIn {
                    from { opacity: 0; backdrop-filter: blur(0); }
                    to { opacity: 1; backdrop-filter: blur(8px); }
                }
                @keyframes manifestScaleIn {
                    from { transform: scale(0.9) translateY(20px); opacity: 0; filter: blur(20px); }
                    to { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
                }
                @keyframes planetRotate {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes dataPacket {
                    from { stroke-dashoffset: 1500; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>

        </div>
    );
}
