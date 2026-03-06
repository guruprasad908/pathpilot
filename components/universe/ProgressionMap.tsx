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
        try {
            const res = await fetch(`/api/subtopics/${subtopicId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                // Optimistically update local state immediately
                setCompletedIds(prev => new Set([...prev, subtopicId]));
                // Update selected node's subtopics in-place so the panel re-renders
                setSelectedNode((prev: any) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        subtopics: prev.subtopics.map((s: any) =>
                            s.id === subtopicId ? { ...s, status: 'completed' } : s
                        )
                    };
                });
                // Notify parent to refresh the roadmap data (updates node glow colors on map)
                onSubtopicComplete?.();
            } else {
                const err = await res.json();
                console.error('Failed to mark complete:', err.error);
            }
        } catch (e) {
            console.error('Failed to mark complete:', e);
        } finally {
            setCompletingId(null);
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
        if (!roadmap) return [];
        // Support both galaxies (plural) and Galaxies (PascalCase) from different API versions
        const galaxies = roadmap.galaxies || roadmap.Galaxies || (Array.isArray(roadmap) ? roadmap : []);
        if (!galaxies || !Array.isArray(galaxies)) return [];

        let totalPoints = 0;
        galaxies.forEach((g: any) => {
            if (g && g.planets && Array.isArray(g.planets)) {
                totalPoints += g.planets.length;
            }
        });

        const SPACING_X = 400;
        const VARIANCE_Y = 150; // Reduced from 250 for better stability
        const DEPTH_RANGE = 100; // Reduced from 150

        let globalIndex = 0;
        galaxies.forEach((g: any, gIndex: number) => {
            if (g.planets && Array.isArray(g.planets)) {
                g.planets.forEach((p: any, pIndex: number) => {
                    const subtopics = p.subtopics || [];
                    let status: 'locked' | 'in_progress' | 'completed' = 'locked';

                    if (subtopics.length > 0) {
                        const allCompleted = subtopics.every((s: any) => s.status === 'completed');
                        const anyStarted = subtopics.some((s: any) => s.status === 'in_progress' || s.status === 'completed');

                        if (allCompleted) status = 'completed';
                        else if (anyStarted) status = 'in_progress';
                    }

                    // Constellation Positioning
                    // Use a seeded pseudo-randomness for stable layout
                    const seed = globalIndex * 137.5;
                    const offsetX = globalIndex * SPACING_X;
                    const offsetY = (Math.sin(seed) * VARIANCE_Y);
                    const offsetZ = (Math.cos(seed) * DEPTH_RANGE);

                    sequence.push({
                        ...p,
                        calcStatus: status,
                        milestoneTitle: pIndex === 0 ? g.title : null,
                        coords: {
                            x: offsetX,
                            y: 400 + offsetY, // Fixed at 400 + offset
                            z: offsetZ
                        },
                        globalIndex
                    });
                    globalIndex++;
                });
            }
        });

        // Determine current node
        let currentFound = false;
        sequence.forEach((n) => {
            if (!currentFound && (n.calcStatus === 'locked' || n.calcStatus === 'in_progress')) {
                n.isCurrent = true;
                currentFound = true;
                if (n.calcStatus === 'locked') n.calcStatus = 'in_progress';
            } else {
                n.isCurrent = false;
            }
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
        // Group nodes by galaxy title for section headers
        const galaxySections = roadmap.galaxies.map((g: any) => ({
            title: g.title,
            planets: nodes.filter((n: any) => n.milestoneTitle !== null || g.planets.some((p: any) => p.id === n.id)).filter((n: any) => g.planets.some((p: any) => p.id === n.id))
        }));

        return (
            <div className="flex flex-col h-full">
                {/* Scrollable planet list */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-4">
                    {galaxySections.map((section: any, si: number) => (
                        <section key={si}>
                            {/* Galaxy header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest-xl shrink-0 px-2">
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
                                            <span className={`text-xs font-mono uppercase tracking-widest-xl shrink-0 ${statusLabelColor}`}>
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
                            <div className="p-4 md:p-6">
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    aria-label="Close panel"
                                    className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <span aria-hidden="true">✕</span>
                                </button>

                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-bold text-white tracking-tight font-display">{selectedNode.title}</h3>
                                    <span className={`px-2.5 py-1 text-xs uppercase tracking-widest-xl font-bold rounded ${selectedNode.calcStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        selectedNode.calcStatus === 'in_progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                            'bg-zinc-800/50 text-zinc-500 border border-white/5'
                                        }`}>
                                        {selectedNode.calcStatus.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid gap-2 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar pb-2">
                                    {selectedNode.subtopics?.map((sub: any, idx: number) => {
                                        const isSubActive = activeSession?.subtopicId === sub.id;
                                        return (
                                            <div key={sub.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono text-xs text-zinc-600 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                                                        <span className="font-medium text-zinc-200 text-sm leading-snug truncate">{sub.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {sub.status !== 'locked' && sub.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleMarkComplete(sub.id)}
                                                                disabled={completingId !== null}
                                                                aria-label={`Mark "${sub.title}" as complete`}
                                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${completingId === sub.id
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-wait'
                                                                    : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                    }`}
                                                            >
                                                                {completingId === sub.id
                                                                    ? <span aria-hidden="true" className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                                    : <span aria-hidden="true">✓</span>}
                                                                Done
                                                            </button>
                                                        )}
                                                        {sub.status === 'completed' && (
                                                            <span className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                ✓ Done
                                                            </span>
                                                        )}
                                                        {sub.status !== 'locked' && (
                                                            <button
                                                                onClick={() => router.push(`/practice/${sub.id}`)}
                                                                aria-label={`Practice: ${sub.title}`}
                                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${sub.status === 'completed'
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                                                    }`}
                                                            >
                                                                {sub.status === 'completed' ? 'Review' : 'Practice'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
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
                    className="absolute inset-0 overflow-x-auto overflow-y-auto hide-scrollbar cursor-grab"
                    style={{
                        padding: '0 50vw'
                    }}
                >
                    <div
                        ref={nodeContainerRef}
                        className="relative h-[800px] flex items-center"
                        style={{
                            width: `${Math.max(window.innerWidth, (nodes.length) * 400 + 1000)}px`,
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {/* Neural Connectors SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <filter id="neural-glow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                                </linearGradient>
                            </defs>
                            {nodes.map((node, i) => {
                                if (i === 0) return null;
                                const prev = nodes[i - 1];
                                const isLinkActive = prev.calcStatus === 'completed';

                                // Neural path (cubic bezier for "organic" feel)
                                const x1 = prev.coords.x + 50;
                                const y1 = prev.coords.y + 50;
                                const x2 = node.coords.x + 50;
                                const y2 = node.coords.y + 50;

                                const cp1x = x1 + (x2 - x1) * 0.5;
                                const cp2x = x1 + (x2 - x1) * 0.5;

                                return (
                                    <path
                                        key={`link-${i}`}
                                        d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                                        stroke={isLinkActive ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.05)'}
                                        strokeWidth={isLinkActive ? "3" : "1"}
                                        fill="none"
                                        filter={isLinkActive ? "url(#neural-glow)" : ""}
                                        className={isLinkActive ? "animate-[linkPulse_4s_infinite]" : ""}
                                    />
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
                                        transform: `translate3d(0, 0, ${node.coords.z}px)`, // Adjusted Y-translate alignment
                                        transformStyle: 'preserve-3d',
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

                                        {/* 3. The Glass Housing (Structural Layer) */}
                                        <div className={`absolute inset-0 rounded-full backdrop-blur-md transition-colors duration-500 border ${isCurrent ? 'bg-black/40 border-cyan-500/50 shadow-[inset_0_0_30px_rgba(34,211,238,0.2)]' :
                                            isCompleted ? 'bg-black/60 border-emerald-500/30' : 'bg-black/80 border-white/10'
                                            }`} />

                                        {/* 4. The Data Core (Inner Center) */}
                                        <div className="relative z-10 flex items-center justify-center w-full h-full pointer-events-none">
                                            {isLocked ? (
                                                <div className="w-4 h-4 rounded-[4px] border border-white/20 bg-white/5 rotate-45 transition-all" />
                                            ) : isCompleted ? (
                                                <div className="w-5 h-5 rounded-[4px] border border-emerald-400 bg-emerald-500/20 rotate-45 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-[4px] border-2 border-cyan-400 bg-cyan-400/20 rotate-45 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse transition-all" />
                                            )}
                                        </div>

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

                                        {/* Orbital Subtopic Moons */}
                                        {!isMobile && (node.subtopics || []).map((sub: any, sIdx: number) => {
                                            const subtopicsCount = node.subtopics.length;
                                            const subAngle = (sIdx / subtopicsCount) * 2 * Math.PI;
                                            const subOrbitRadius = 75; // 100px width = 50 radius + 25 gap
                                            const subX = 50 + subOrbitRadius * Math.cos(subAngle) - 8; // -8 for half 16px width
                                            const subY = 50 + subOrbitRadius * Math.sin(subAngle) - 8;
                                            
                                            let subColor = "bg-zinc-800 border-zinc-700";
                                            if (sub.status === 'completed') subColor = "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                                            else if (sub.status === 'in_progress') subColor = "bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]";

                                            return (
                                                <div 
                                                    key={`sub-${sIdx}`}
                                                    className={`absolute w-[16px] h-[16px] rounded-full border flex items-center justify-center group/submoon ${subColor} hover:scale-125 transition-transform cursor-pointer`}
                                                    style={{ left: `${subX}px`, top: `${subY}px` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (sub.status !== 'locked') {
                                                            router.push(`/practice/${sub.id || roadmap.id}`); 
                                                        }
                                                    }}
                                                >
                                                   <div className="absolute w-max bg-black/90 border border-white/10 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/submoon:opacity-100 transition-opacity -top-8 pointer-events-none whitespace-nowrap z-20">
                                                       {sub.title}
                                                   </div>
                                                </div>
                                            )
                                        })}
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

            {/* ─── Mission Manifest Glass Modal ─────────────────────────────── */}
            {selectedNode && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    style={{ animation: 'manifestFadeIn 0.3s ease-out forwards' }}
                    onClick={() => setSelectedNode(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-[#030303]/90 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden"
                        style={{ animation: 'manifestScaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top Energy Accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                        <div className="p-8 md:p-10">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-zinc-500 hover:text-white transition-all border border-white/5 hover:border-white/20"
                                aria-label="Close panel"
                            >
                                <span className="text-base leading-none">✕</span>
                            </button>

                            {/* Header */}
                            <div className="mb-8 pr-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedNode.calcStatus === 'completed'
                                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                                        : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)] animate-pulse'
                                        }`} />
                                    <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-600">
                                        Mission Protocol · {selectedNode.calcStatus.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
                                    {selectedNode.title}
                                </h3>
                                <p className="text-zinc-500 text-sm leading-relaxed font-light">
                                    {selectedNode.description || `Execute all sub-protocols in the ${selectedNode.title} sector to advance your trajectory.`}
                                </p>
                            </div>

                            {/* Subtopic List */}
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedNode.subtopics?.map((sub: any, idx: number) => {
                                    const isSubActive = activeSession?.subtopicId === sub.id;
                                    const sessionCount = sub.sessionCount || 0;
                                    const totalMinutes = Math.floor((sub.totalTime || 0) / 60);

                                    return (
                                        <div
                                            key={sub.id}
                                            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-white/10"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-mono text-[10px] text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors truncate">
                                                            {sub.title}
                                                        </div>
                                                        {(sessionCount > 0 || totalMinutes > 0) && (
                                                            <div className="text-[10px] font-mono text-zinc-700 mt-0.5 uppercase tracking-wider">
                                                                {sessionCount > 0 && `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`}
                                                                {sessionCount > 0 && totalMinutes > 0 && ' · '}
                                                                {totalMinutes > 0 && `${totalMinutes}m studied`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Study Timer */}
                                                    {sub.status !== 'locked' && (
                                                        isSubActive ? (
                                                            <button
                                                                onClick={() => handleEndStudy(sub.id)}
                                                                className="flex items-center gap-1.5 text-rose-400 text-[10px] font-mono bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" />
                                                                {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleStartStudy(sub.id)}
                                                                disabled={activeSession !== null}
                                                                className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg transition-all border ${activeSession
                                                                    ? 'text-zinc-700 border-white/5 cursor-not-allowed'
                                                                    : 'text-zinc-500 border-white/5 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                                                                    }`}
                                                            >
                                                                ⏱
                                                            </button>
                                                        )
                                                    )}

                                                    {/* Mark Complete */}
                                                    {sub.status !== 'locked' && sub.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleMarkComplete(sub.id)}
                                                            disabled={completingId !== null}
                                                            aria-label={`Mark "${sub.title}" as complete`}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${completingId === sub.id
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-wait'
                                                                : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                                                }`}
                                                        >
                                                            {completingId === sub.id ? (
                                                                <span aria-hidden="true" className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <span aria-hidden="true">✓</span>
                                                            )}
                                                            Done
                                                        </button>
                                                    )}

                                                    {/* Status Badge */}
                                                    {sub.status === 'completed' && (
                                                        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            ✓ Completed
                                                        </span>
                                                    )}

                                                    {/* Practice Button */}
                                                    <button
                                                        onClick={() => router.push(`/practice/${sub.id}`)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${sub.status === 'locked'
                                                            ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-600'
                                                            : sub.status === 'completed'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-400 hover:text-black'
                                                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                                            }`}
                                                        disabled={sub.status === 'locked'}
                                                    >
                                                        {sub.status === 'completed' ? 'Review' : 'Practice'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                @keyframes linkPulse {
                    0%, 100% { opacity: 0.1; stroke-width: 1.5; }
                    50% { opacity: 0.4; stroke-width: 2.5; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

        </div>
    );
}
