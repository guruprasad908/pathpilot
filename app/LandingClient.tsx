'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

export default function LandingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Smooth scroll progress for parallax
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Parallax transforms for background assets
    const heroY = useTransform(smoothProgress, [0, 0.2], [0, -100]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
    const astronaut1Y = useTransform(smoothProgress, [0, 1], [0, -300]);
    const astronaut2Y = useTransform(smoothProgress, [0, 1], [0, 200]);

    return (
        <div ref={containerRef} className="min-h-screen text-zinc-100 selection:bg-white/10 flex flex-col font-display overflow-x-hidden relative">

            {/* ─── Header ──────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12 md:py-8 flex justify-between items-center text-zinc-400 backdrop-blur-md bg-black/10 border-b border-white/5 transition-colors">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-4"
                >
                    <span className="text-xl font-bold tracking-[0.4em] text-white uppercase font-display select-none">
                        PathPilot
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-8"
                >
                    {isLoggedIn ? (
                        <Link
                            href="/dashboard"
                            className="text-xs font-bold uppercase tracking-widest-xl px-6 py-3 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all duration-300"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-xs font-bold uppercase tracking-widest-xl text-zinc-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/login"
                                className="text-xs font-bold uppercase tracking-widest-xl bg-white text-black px-6 py-3 rounded-full hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </motion.div>
            </header>

            {/* ─── Hero Section ────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col relative z-10">
                <section className="relative px-6 pt-52 pb-32 md:pt-64 md:pb-52 flex flex-col items-center justify-center text-center max-w-6xl mx-auto w-full min-h-screen">
                    <motion.div
                        style={{ y: heroY, opacity: heroOpacity }}
                        className="flex flex-col items-center"
                    >
                        {/* Minimalist tagline */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="flex items-center gap-4 mb-12"
                        >
                            <div className="w-12 h-px bg-white/10" />
                            <span className="font-mono text-xs text-zinc-300 uppercase tracking-widest-xl">AI-Powered Learning Roadmaps</span>
                            <div className="w-12 h-px bg-white/10" />
                        </motion.div>

                        {/* Main headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-[-0.04em] mb-12 leading-[0.85] max-w-5xl font-display"
                        >
                            <span className="text-white block">
                                The Architecture
                            </span>
                            <span className="text-white opacity-40 block mt-4">
                                of Mastery.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-16 font-light leading-relaxed tracking-tight"
                        >
                            Tell PathPilot what you want to learn. In seconds, get a structured, market-aware curriculum, broken into galaxies, topics, and subtopics, built around your experience level and daily time.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 1 }}
                            className="flex flex-col sm:flex-row gap-6"
                        >
                            <Link
                                href={isLoggedIn ? "/dashboard" : "/login"}
                                className="px-12 py-5 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-full hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                {isLoggedIn ? "Open Console" : "Begin Analysis"}
                            </Link>
                            <a
                                href="#how-it-works"
                                className="px-12 py-5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest-xl rounded-full hover:bg-white/5 transition-all duration-300"
                            >
                                Learn More
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* Atmospheric Horizon Glow */}
                    <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-white/[0.03] blur-[150px] rounded-[100%] pointer-events-none" />
                </section>

                {/* ─── Stats Panel ─────────────────── */}
                <SectionWrapper>
                    <div className="w-full max-w-4xl mx-auto relative mb-32">
                        <div className="glass-premium rounded-3xl p-1 bg-white/[0.01] border border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                                {[
                                    { label: 'Generation Time', value: '< 30s', sub: 'Full roadmap, any topic' },
                                    { label: 'Learning Levels', value: '3', sub: 'Beginner · Mid · Advanced' },
                                    { label: 'Topics Covered', value: '∞', sub: 'Any domain, any depth' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                        className="p-10 text-left space-y-3 group"
                                    >
                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest-xl group-hover:text-white transition-colors">{stat.label}</div>
                                        <div className="text-4xl font-bold text-white font-display tracking-tight">{stat.value}</div>
                                        <div className="text-xs text-zinc-600 uppercase tracking-widest">{stat.sub}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionWrapper>

                {/* ─── Divider ─────────────────── */}
                <div className="w-full max-w-4xl mx-auto px-6 mb-40" id="how-it-works">
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                </div>

                {/* ─── Framework Section ───────────────────────────────── */}
                <SectionWrapper>
                    <section className="px-6 py-40 max-w-7xl mx-auto w-full">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 font-display">How PathPilot Works</h2>
                            <p className="text-zinc-500 text-lg max-w-xl mx-auto font-light leading-relaxed">
                                From topic to full curriculum in three steps. No fluff, no filler.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                            {[
                                {
                                    num: '01',
                                    label: 'Set Your Profile',
                                    desc: 'Tell PathPilot your experience level, how deep you want to go, and how much time you have each day. The AI calibrates everything around you.',
                                },
                                {
                                    num: '02',
                                    label: 'Generate Your Roadmap',
                                    desc: 'Type any topic like Python, System Design, Machine Learning, or Blockchain. The AI builds a full structured curriculum with market context and key tools.',
                                },
                                {
                                    num: '03',
                                    label: 'Navigate Your Universe',
                                    desc: 'Explore your roadmap as an interactive space map. Mark progress, track study time, and get adaptive practice questions as you advance.',
                                },
                            ].map((card, i) => (
                                <motion.div
                                    key={card.num}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, delay: i * 0.15 }}
                                    className="space-y-8 group"
                                >
                                    <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest-xl group-hover:text-white transition-colors duration-500">
                                        Step {card.num}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{card.label}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed font-light">{card.desc}</p>
                                    <div className="w-12 h-px bg-white/5 group-hover:w-full transition-all duration-700" />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </SectionWrapper>

                {/* ─── Signals Section ───────────────── */}
                <SectionWrapper>
                    <section className="px-6 py-40 relative border-t border-white/5">
                        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-24">
                            <div className="flex-1 space-y-10 text-left">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white uppercase tracking-widest-xl"
                                >
                                    Intelligent Progress Tracking
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-display"
                                >
                                    Know Exactly<br />
                                    <span className="text-zinc-500 opacity-40">Where You Stand.</span>
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="text-zinc-400 text-lg leading-relaxed max-w-lg font-light"
                                >
                                    PathPilot tracks your actual study time per topic and surfaces which concepts are taking longer than expected — so you can prioritize intelligently, not blindly.
                                </motion.p>
                                <div className="grid grid-cols-2 gap-8 pt-4">
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-2">5 min</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest-xl font-bold">Study Session Minimum</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-2">Real-time</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest-xl font-bold">Progress Visibility</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right side decorative panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="flex-1 w-full"
                            >
                                <div className="glass-premium rounded-3xl p-10 relative overflow-hidden bg-white/[0.01] border border-white/5 shadow-2xl">
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    </div>
                                    <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest-xl mb-10">
                                        Live Study Intelligence
                                    </div>
                                    <div className="space-y-8">
                                        {[
                                            { name: 'React Hooks & State', time: '34m', status: 'Deep Focus', color: 'rose' },
                                            { name: 'REST API Design', time: '18m', status: 'On Track', color: 'zinc' },
                                            { name: 'SQL Query Optimization', time: '9m', status: 'Quick Win', color: 'white' },
                                        ].map(row => (
                                            <div key={row.name} className="flex items-center justify-between group">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{row.name}</div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{row.status}</div>
                                                </div>
                                                <div className="text-[10px] font-mono text-zinc-600">{row.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                </SectionWrapper>

                {/* ─── Final CTA ───────────────── */}
                <SectionWrapper>
                    <section className="px-6 py-52 text-center max-w-4xl mx-auto w-full relative z-10 border-t border-white/5 mb-20">
                        <h2 className="text-5xl md:text-8xl font-extrabold text-white mb-8 tracking-tight font-display">
                            Start Learning<br />
                            <span className="opacity-40">Smarter, Today.</span>
                        </h2>
                        <p className="text-zinc-400 mb-16 text-xl font-light leading-relaxed max-w-2xl mx-auto">
                            Join PathPilot for free. Generate your first AI roadmap in under a minute. No credit card, no setup, no fluff.
                        </p>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link
                                href={isLoggedIn ? "/dashboard" : "/login"}
                                className="inline-block px-14 py-6 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-full transition-all duration-500 shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.25)]"
                            >
                                {isLoggedIn ? "Access Dashboard" : "Create Free Account"}
                            </Link>
                        </motion.div>
                    </section>
                </SectionWrapper>
            </main>

            {/* ─── Footer ──────────────── */}
            <footer className="relative z-10 border-t border-white/5 py-12 px-6 flex flex-col sm:flex-row items-center justify-between gap-8 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <span className="text-base font-bold tracking-[0.3em] text-white uppercase font-display select-none">PathPilot</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-8 font-mono text-[10px] text-zinc-500 uppercase tracking-widest-xl">
                    <span>© 2026 PathPilot. All rights reserved.</span>
                    <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-800" />
                    <span>Built for learners. Powered by AI.</span>
                </div>
            </footer>
        </div>
    );
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}
