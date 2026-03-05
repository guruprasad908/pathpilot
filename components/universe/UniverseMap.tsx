'use client';

import React, { useState, MouseEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function UniverseMap({ roadmap }: { roadmap: any }) {
    const router = useRouter();

    // Mouse tilt state
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = (e.clientX - centerX) / (rect.width / 2); // -1 to 1
        let dy = (e.clientY - centerY) / (rect.height / 2); // -1 to 1

        // Clamp to -1 to 1
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));

        // Max tilt is 5 degrees
        setTilt({ x: dy * -5, y: dx * 5 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // Data parsing
    const planets = useMemo(() => {
        const allPlanets: any[] = [];
        if (!roadmap || !roadmap.galaxies) return [];

        roadmap.galaxies.forEach((g: any) => {
            if (g.planets && Array.isArray(g.planets)) {
                g.planets.forEach((p: any) => {
                    const subtopics = p.subtopics || [];
                    let status: 'locked' | 'in_progress' | 'completed' = 'locked';

                    if (subtopics.length > 0) {
                        const allCompleted = subtopics.every((s: any) => s.status === 'completed');
                        const anyStarted = subtopics.some((s: any) => s.status === 'in_progress' || s.status === 'completed');

                        if (allCompleted) status = 'completed';
                        else if (anyStarted) status = 'in_progress';
                    }
                    allPlanets.push({
                        ...p,
                        calcStatus: status
                    });
                });
            }
        });

        // Determine current planet (first one not completed)
        let currentFound = false;
        allPlanets.forEach((p) => {
            if (!currentFound && (p.calcStatus === 'locked' || p.calcStatus === 'in_progress')) {
                p.isCurrent = true;
                currentFound = true;
                // If it was locked, it's now mathematically our "in_progress" target mechanically 
                if (p.calcStatus === 'locked') p.calcStatus = 'in_progress';
            } else {
                p.isCurrent = false;
            }
        });

        return allPlanets;
    }, [roadmap]);

    // Geometry parameters
    const MAP_SIZE = 1200;
    const CENTER = MAP_SIZE / 2;
    const ORBIT_RADIUS = 350;

    return (
        <div
            className="w-full h-full relative flex items-center justify-center bg-transparent"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="relative w-[1200px] h-[1200px] transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* SVG Render Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
                    <defs>
                        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.15)" />
                            <stop offset="70%" stopColor="rgba(34, 211, 238, 0.05)" />
                            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                        </radialGradient>
                    </defs>

                    {/* Central Glow Effect */}
                    <circle cx={CENTER} cy={CENTER} r="350" fill="url(#glow)" className="animate-pulse" style={{ animationDuration: '4s' }} />

                    {/* Orbit Ring */}
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={ORBIT_RADIUS}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="1"
                        fill="none"
                        strokeDasharray="4 8"
                    />

                    {/* Connection Paths & Starbase Shadows */}
                    {planets.map((planet, i) => {
                        const angle = (i / planets.length) * 2 * Math.PI - Math.PI / 2;
                        const x = CENTER + ORBIT_RADIUS * Math.cos(angle);
                        const y = CENTER + ORBIT_RADIUS * Math.sin(angle);
                        const isCompleted = planet.calcStatus === 'completed';
                        return (
                            <line
                                key={`line-${planet.id}`}
                                x1={CENTER}
                                y1={CENTER}
                                x2={x}
                                y2={y}
                                stroke={isCompleted ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 255, 255, 0.05)'}
                                strokeWidth="2"
                            />
                        );
                    })}
                </svg>

                {/* HTML Nodes Layer */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">

                    {/* Central Roadmap Root Node */}
                    <div
                        className="absolute flex items-center justify-center rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto group"
                        style={{
                            width: '180px',
                            height: '180px',
                            left: `${CENTER - 90}px`,
                            top: `${CENTER - 90}px`,
                            transform: `translateZ(40px)`
                        }}
                    >
                        <div className="text-center px-4">
                            <h1 className="text-sm font-bold text-white uppercase tracking-widest-xl font-display">{roadmap?.title || 'Mission'}</h1>
                            <p className="text-xs text-cyan-500 mt-2 tracking-widest-xl font-mono opacity-80 uppercase">Root Directory</p>
                        </div>
                    </div>

                    {/* Planet Nodes */}
                    {planets.map((planet, i) => {
                        const angle = (i / planets.length) * 2 * Math.PI - Math.PI / 2;
                        const x = CENTER + ORBIT_RADIUS * Math.cos(angle);
                        const y = CENTER + ORBIT_RADIUS * Math.sin(angle);

                        // Status mapping
                        let baseClasses = "absolute rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer pointer-events-auto hover:scale-110 ";
                        let styleExt = { width: '80px', height: '80px', left: `${x - 40}px`, top: `${y - 40}px`, transform: 'translateZ(10px)' };

                        if (planet.calcStatus === 'locked') {
                            baseClasses += "bg-black/80 border border-zinc-800 opacity-60 grayscale hover:border-zinc-700";
                        } else if (planet.calcStatus === 'in_progress') {
                            // Cyan border pulse
                            baseClasses += "bg-black/95 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-[premiumPulse_4s_ease-in-out_infinite]";
                        } else if (planet.calcStatus === 'completed') {
                            // Emerald glow
                            baseClasses += "bg-black/95 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
                        }

                        return (
                            <div
                                key={planet.id}
                                className={baseClasses}
                                style={styleExt}
                                onClick={() => router.push(`/roadmap/${roadmap.id}`)} // Temp routing to original view for now
                            >
                                <span className="text-xs text-white font-medium text-center leading-tight px-2 group-hover:text-cyan-300 transition-colors">
                                    {planet.title}
                                </span>

                                {/* Astronaut Icon for Current Node */}
                                {planet.isCurrent && (
                                    <div className="absolute -top-6 bg-[#050510] border border-cyan-500 rounded-full p-1 animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                            <path d="M19 9v2c0 2-2 4-4 4H9c-2 0-4-2-4-4V9" />
                                            <path d="M12 10v4" />
                                            <path d="M6 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                            <path d="M22 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                            <path d="M9 22v-4H6a2 2 0 0 1-2-2v-2" />
                                            <path d="M15 22v-4h3a2 2 0 0 0 2-2v-2" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
