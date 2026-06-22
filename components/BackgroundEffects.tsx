'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import FloatingAstronaut from './FloatingAstronaut';

export default function BackgroundEffects() {
    const [mounted, setMounted] = useState(false);

    // Refs for parallax elements to bypass React state for performance
    const hudRef = useRef<HTMLDivElement>(null);
    const farRef = useRef<HTMLDivElement>(null);
    const midRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);

        let animationFrameId: number;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            targetX = (e.clientX / window.innerWidth - 0.5) * 20;
            targetY = (e.clientY / window.innerHeight - 0.5) * 20;
        };

        const animate = () => {
            // Smooth interpolation
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            if (hudRef.current) hudRef.current.style.transform = `translate3d(${currentX * 0.3}px, ${currentY * 0.3}px, 0)`;
            if (farRef.current) farRef.current.style.transform = `translate3d(${currentX * 0.5}px, ${currentY * 0.5}px, 0)`;
            if (midRef.current) midRef.current.style.transform = `translate3d(${currentX * 1.2}px, ${currentY * 1.2}px, 0)`;
            if (closeRef.current) closeRef.current.style.transform = `translate3d(${currentX * 2.5}px, ${currentY * 2.5}px, 0)`;

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Generate static star data once to avoid re-renders
    const starLayers = useMemo(() => {
        const generateStars = (count: number) => {
            return [...Array(count)].map((_, i) => ({
                id: i,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.7 + 0.3,
                delay: Math.random() * 5,
                duration: Math.random() * 3 + 2,
            }));
        };

        return {
            far: generateStars(100),
            mid: generateStars(50),
            close: generateStars(20),
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[-5] overflow-hidden bg-black select-none" style={{ pointerEvents: 'none' }}>
            {/* Global HUD Grid Overlay */}
            <div
                ref={hudRef}
                className="hud-grid pointer-events-none"
            />

            {/* Parallax Star Layers */}
            <div
                ref={farRef}
                className="parallax-layer"
            >
                {starLayers.far.map(star => (
                    <div
                        key={`far-${star.id}`}
                        className="star"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: `${star.size * 0.5}px`,
                            height: `${star.size * 0.5}px`,
                            opacity: star.opacity * 0.5,
                            animation: `starTwinkle ${star.duration}s ease-in-out infinite`,
                            animationDelay: `${star.delay}s`
                        }}
                    />
                ))}
            </div>

            <div
                ref={midRef}
                className="parallax-layer"
            >
                {starLayers.mid.map(star => (
                    <div
                        key={`mid-${star.id}`}
                        className="star"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            animation: `starTwinkle ${star.duration}s ease-in-out infinite`,
                            animationDelay: `${star.delay}s`
                        }}
                    />
                ))}
            </div>

            <div
                ref={closeRef}
                className="parallax-layer"
            >
                {starLayers.close.map(star => (
                    <div
                        key={`close-${star.id}`}
                        className="star"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: `${star.size * 1.5}px`,
                            height: `${star.size * 1.5}px`,
                            opacity: star.opacity,
                            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                            animation: `starTwinkle ${star.duration}s ease-in-out infinite`,
                            animationDelay: `${star.delay}s`
                        }}
                    />
                ))}
            </div>

            {/* Shooting Stars */}
            <ShootingStarManager />

            {/* Floating Astronauts */}
            <FloatingAstronaut delay={0} startX="15%" startY="10%" scale={0.7} duration={80} />
            <FloatingAstronaut delay={30} startX="70%" startY="80%" scale={0.5} duration={100} />

            {/* Massive Space Base (Phase V13 - Deep Background) */}
            <SpaceBase />

            {/* Transit Spaceships (Phase V13 - Refined Transit Flow) */}
            <FloatingSpaceship delay={0} startX="-20%" startY="10%" endX="120%" endY="90%" scale={1.1} duration={70} />
            <FloatingSpaceship delay={25} startX="110%" startY="0%" endX="-20%" endY="100%" scale={0.8} duration={90} />
            <FloatingSpaceship delay={60} startX="40%" startY="-20%" endX="60%" endY="120%" scale={0.6} duration={130} />
            <FloatingSpaceship delay={95} startX="20%" startY="120%" endX="80%" endY="-20%" scale={0.5} duration={160} />

            {/* Subtle Scanline Texture Overlay */}
            <div className="scanline-overlay" />

            {/* Deep Vignette Layer */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
        </div>
    );
}

function SpaceBase() {
    return (
        <div
            className="absolute opacity-[0.35] z-[-1] transition-opacity duration-1000"
            style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(2.5)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                filter: 'brightness(0.9) contrast(1.1)'
            }}
        >
            <img
                src="/images/space-base.png"
                alt="Massive architectural space station"
                className="w-[800px] h-auto select-none opacity-80"
                style={{
                    maskImage: 'radial-gradient(circle, black 20%, transparent 60%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 60%)',
                    filter: 'contrast(1.2) brightness(0.7) blur(1px)'
                }}
            />
            {/* Technical Light Cluster */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[40%] left-[45%] w-1.5 h-1.5 bg-white rounded-full blur-[2px] animate-tech-glow" />
                <div className="absolute top-[55%] left-[52%] w-2 h-2 bg-white rounded-full blur-[3px] animate-tech-glow" style={{ animationDelay: '1.2s' }} />
                <div className="absolute top-[48%] left-[38%] w-1 h-1 bg-white rounded-full blur-[1px] animate-tech-glow" style={{ animationDelay: '2.5s' }} />
                <div className="absolute top-[62%] left-[58%] w-1 h-1 bg-white rounded-full blur-[1px] animate-tech-glow" style={{ animationDelay: '0.8s' }} />
            </div>

            {/* Technical Pulse Glow (Background ambient) */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />

            <style jsx>{`
                @keyframes techGlow {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px white; }
                }
                .animate-tech-glow {
                    animation: techGlow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

function ShootingStarManager() {
    const [stars, setStars] = useState<{ id: number, top: string, left: string, delay: number }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.3) {
                const id = Date.now();
                const newStar = {
                    id,
                    top: `${Math.random() * 50}%`,
                    left: `${50 + Math.random() * 50}%`,
                    delay: Math.random() * 2
                };
                setStars(prev => [...prev, newStar]);
                setTimeout(() => {
                    setStars(prev => prev.filter(s => s.id !== id));
                }, 4000);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {stars.map(star => (
                <div
                    key={star.id}
                    className="shooting-star"
                    style={{
                        top: star.top,
                        left: star.left,
                        animation: `shootingStar 3s ease-out forwards`,
                        animationDelay: `${star.delay}s`
                    }}
                />
            ))}
        </>
    );
}



function FloatingSpaceship({
    delay,
    startX,
    startY,
    endX,
    endY,
    scale = 1,
    duration = 60,
}: {
    delay: number,
    startX: string,
    startY: string,
    endX: string,
    endY: string,
    scale?: number,
    duration?: number,
}) {
    return (
        <div
            className="absolute opacity-[0.25] transition-opacity duration-1000 hover:opacity-60"
            style={{
                top: startY || '0%',
                left: startX || '0%',
                transform: `scale(${scale})`,
                animation: `transitSpaceship-${(startX || '0').toString().replace('%', '')} ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                mixBlendMode: 'screen',
                zIndex: 2,
                opacity: 0.45
            }}
        >
            <div className="relative">
                <img
                    src="/images/spaceship-cinematic.png"
                    alt="Realistic architectural spaceship in transit"
                    className="w-[320px] h-auto select-none pointer-events-none"
                    style={{
                        maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                        filter: 'contrast(1.2) brightness(0.8)'
                    }}
                />
                {/* Technical Lights */}
                <div className="absolute top-[45%] left-[20%] w-1 h-1 bg-white rounded-full blur-[1px] animate-tech-glow-fast" />
                <div className="absolute top-[52%] left-[45%] w-1.5 h-1.5 bg-white rounded-full blur-[2px] animate-tech-glow-fast" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-[40%] left-[75%] w-1 h-1 bg-white rounded-full blur-[1px] animate-tech-glow-fast" style={{ animationDelay: '1.2s' }} />
            </div>

            <style jsx>{`
                @keyframes transitSpaceship-${(startX || '0').replace('%', '')} {
                    0% { 
                        transform: translate(0, 0) rotate(0deg) scale(${scale}); 
                        opacity: 0;
                    }
                    10% { opacity: 0.25; }
                    90% { opacity: 0.25; }
                    100% { 
                        transform: translate(calc(${endX || '0%'} - ${startX || '0%'}), calc(${endY || '0%'} - ${startY || '0%'})) rotate(5deg) scale(${scale}); 
                        opacity: 0;
                    }
                }
                @keyframes techGlowFast {
                    0%, 100% { opacity: 0.3; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px white; }
                }
                .animate-tech-glow-fast {
                    animation: techGlowFast 3.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
