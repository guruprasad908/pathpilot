import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NavBar from '../../components/NavBar';
import { getSession } from '../../lib/auth';
import { db } from '../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
    const userData = await getSession();
    if (!userData) redirect('/login');
    const userId = userData.user_id;

    // 1. Direct Profile Query
    const profileResult = await db.query(`
        SELECT lp.*, up.full_name, u.has_completed_onboarding
        FROM users u
        LEFT JOIN user_learning_profile lp ON u.id = lp.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
    `, [userId]);

    const profile = profileResult.rows[0];
    if (!profile || !profile.experience_level) {
        redirect('/profile');
    }

    // 2. Direct Roadmap Query (logic from api/roadmaps/route.ts)
    const roadmapResult = await db.query(`
        SELECT 
            r.id as roadmap_id, r.title as roadmap_title,
            g.id as galaxy_id, g.title as galaxy_title,
            p.id as planet_id, p.title as planet_title, p.order_index as planet_order,
            s.id as subtopic_id, s.title as subtopic_title, s.order_index as subtopic_order,
            sp.status as progress_status, sp.percent_done
        FROM roadmaps r
        JOIN users u ON u.id = $1 AND r.id = u.active_roadmap_id
        LEFT JOIN galaxies g ON g.roadmap_id = r.id
        LEFT JOIN planets p ON p.galaxy_id = g.id
        LEFT JOIN subtopics s ON s.planet_id = p.id
        LEFT JOIN subtopic_progress sp ON sp.subtopic_id = s.id AND sp.user_id = $1
        ORDER BY r.created_at DESC, g.created_at ASC, p.order_index ASC, s.order_index ASC
    `, [userId]);

    const roadmapsMap = new Map();
    roadmapResult.rows.forEach(row => {
        if (!roadmapsMap.has(row.roadmap_id)) {
            roadmapsMap.set(row.roadmap_id, {
                id: row.roadmap_id,
                title: row.roadmap_title,
                galaxies: new Map()
            });
        }
        const roadmap = roadmapsMap.get(row.roadmap_id);
        if (row.galaxy_id) {
            if (!roadmap.galaxies.has(row.galaxy_id)) {
                roadmap.galaxies.set(row.galaxy_id, {
                    id: row.galaxy_id,
                    title: row.galaxy_title,
                    planets: new Map()
                });
            }
            const galaxy = roadmap.galaxies.get(row.galaxy_id);
            if (row.planet_id) {
                if (!galaxy.planets.has(row.planet_id)) {
                    galaxy.planets.set(row.planet_id, {
                        id: row.planet_id,
                        title: row.planet_title,
                        orderIndex: row.planet_order,
                        subtopics: []
                    });
                }
                const planet = galaxy.planets.get(row.planet_id);
                if (row.subtopic_id) {
                    planet.subtopics.push({
                        id: row.subtopic_id,
                        title: row.subtopic_title,
                        orderIndex: row.subtopic_order,
                        status: row.progress_status || 'not_started',
                        percentDone: row.percent_done || 0
                    });
                }
            }
        }
    });

    const roadmaps = Array.from(roadmapsMap.values()).map(roadmap => ({
        ...roadmap,
        galaxies: Array.from(roadmap.galaxies.values()).map((galaxy: any) => ({
            ...galaxy,
            planets: Array.from(galaxy.planets.values())
        }))
    }));

    // 3. Direct Stats Query
    const statsQuery = await db.query(`
        SELECT 
            COALESCE(SUM(duration_seconds), 0)::INTEGER as total_seconds,
            COUNT(*)::INTEGER as total_sessions,
            (SELECT COUNT(*) FROM subtopic_progress WHERE user_id = $1 AND status = 'completed')::INTEGER as completed_topics_count,
            (SELECT COUNT(*) FROM roadmaps WHERE user_id = $1)::INTEGER as roadmaps_count
        FROM study_sessions 
        WHERE user_id = $1 AND duration_seconds IS NOT NULL
    `, [userId]);

    const stats = statsQuery.rows[0];
    const globalStats = {
        totalSeconds: stats.total_seconds || 0,
        sessionsCount: stats.total_sessions || 0,
        completedTopics: stats.completed_topics_count || 0
    };

    // 4. Direct Top Study Stats (logic from api/study/top/route.ts)
    const topStatsResult = await db.query(`
        SELECT 
            ss.subtopic_id,
            s.title as subtopic_title,
            p.title as planet_title,
            g.title as galaxy_title,
            COALESCE(SUM(ss.duration_seconds), 0)::INTEGER as total_time,
            COUNT(ss.id)::INTEGER as study_sessions_count
        FROM study_sessions ss
        JOIN subtopics s ON s.id = ss.subtopic_id
        JOIN planets p ON p.id = s.planet_id
        JOIN galaxies g ON g.id = p.galaxy_id
        WHERE ss.user_id = $1 AND ss.duration_seconds IS NOT NULL
        GROUP BY ss.subtopic_id, s.title, p.title, g.title
        ORDER BY total_time DESC
        LIMIT 5
    `, [userId]);

    const topStudyStats = { topSubtopics: topStatsResult.rows };
    const activeRoadmap = roadmaps.length > 0 ? roadmaps[0] : null;

    let totalModules = 0;
    let completedModules = 0;

    if (activeRoadmap) {
        activeRoadmap.galaxies.forEach((galaxy: any) => {
            galaxy.planets.forEach((planet: any) => {
                totalModules += planet.subtopics.length;
                completedModules += planet.subtopics.filter((st: any) => st.status === 'completed').length;
            });
        });
    }

    const completionPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Improved time formatting for short sessions
    let studyTimeDisplay = "0m";
    if (globalStats.totalSeconds >= 3600) {
        studyTimeDisplay = `${(globalStats.totalSeconds / 3600).toFixed(1)}h`;
    } else if (globalStats.totalSeconds >= 60) {
        studyTimeDisplay = `${Math.floor(globalStats.totalSeconds / 60)}m`;
    } else if (globalStats.totalSeconds > 0) {
        studyTimeDisplay = `${globalStats.totalSeconds}s`;
    }

    return (
        <div className="min-h-screen font-display text-zinc-100 selection:bg-white/10 flex flex-col relative overflow-x-hidden">
            <NavBar />

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 md:py-16 flex-1 relative z-10">

                {/* Page header */}
                <header className="mb-10 relative">
                    <div className="absolute -left-4 sm:-left-8 top-1/2 -translate-y-1/2 w-1 h-12 bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-r" />
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white font-display">
                        Mission <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Dashboard</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed font-light">
                        Your active roadmap and study progress at a glance.
                    </p>
                </header>

                <main className="flex flex-col gap-6">

                    {/* ── PRIMARY DIRECTIVE CARD (hero) ─────────────────────────── */}
                    {!activeRoadmap ? (
                        /* Empty state — no roadmap yet */
                        <div className="py-20 animate-[fadeIn_0.6s_ease-out_forwards]">
                            <div className="relative overflow-hidden rounded-3xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center shadow-panel">
                                {/* Accent glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-lg relative z-10">
                                    <span className="text-3xl grayscale opacity-40">🚀</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3">No active mission paths</h2>
                                <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto font-light leading-relaxed">
                                    You haven't initialized any learning sequences yet. Begin your journey by architecting a new roadmap.
                                </p>
                                <div className="mt-12">
                                    <Link
                                        href="/builder"
                                        className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        Initialize Protocol →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Active roadmap — strong border + glow to set it apart as the hero card */
                        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-2xl p-8 md:p-12 shadow-2xl">
                            {/* Top accent glow line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            {/* Radial glow in top-right */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                                <div className="flex-1 min-w-0">
                                    {/* Section label */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                                        <span className="font-mono text-xs text-white tracking-widest-xl uppercase font-bold">Active Roadmap</span>
                                    </div>

                                    {/* Roadmap title — the biggest element on the page */}
                                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight leading-tight font-display">
                                        {activeRoadmap.title}
                                    </h2>

                                    {/* Progress bar */}
                                    <div className="w-full max-w-lg">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest-xl">Your Progress</span>
                                            <span className="text-white font-extrabold text-lg tabular-nums leading-none drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">{completionPercent}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                                            <div
                                                className="h-full bg-gradient-to-r from-white to-zinc-500 relative shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out"
                                                style={{ width: `${completionPercent}%` }}
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                                            </div>
                                        </div>
                                        <div className="mt-3 text-[10px] text-zinc-500 font-mono tracking-widest-xl uppercase opacity-60">
                                            {completedModules} of {totalModules} sectors secured
                                        </div>
                                    </div>
                                </div>

                                {/* CTA buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto">
                                    <Link
                                        href={`/universe/${activeRoadmap.id}`}
                                        className="flex-1 lg:flex-none text-center px-10 py-4 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        Resume Mission →
                                    </Link>
                                    <Link
                                        href="/builder"
                                        className="flex-1 lg:flex-none text-center px-8 py-4 bg-zinc-900/50 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-widest-xl rounded-xl transition-all duration-300"
                                    >
                                        New Sequence
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECONDARY CARDS (subdued visual weight) ──────────────── */}
                    {activeRoadmap && totalModules > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Study History — 2/3 width */}
                            <div className="lg:col-span-2 bg-zinc-900/10 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-panel">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                <h3 className="text-xs font-mono font-bold text-white tracking-widest-xl uppercase mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                                    Study History
                                </h3>

                                {topStudyStats && topStudyStats.topSubtopics && topStudyStats.topSubtopics.length > 0 ? (
                                    <div className="grid gap-2">
                                        {topStudyStats.topSubtopics.map((item: any, idx: number) => {
                                            const m = Math.floor(item.total_time / 60);
                                            const s = item.total_time % 60;
                                            const timeString = m > 0 ? `${m}m ${s}s` : `${s}s`;

                                            return (
                                                <div key={item.subtopic_id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl hover:bg-zinc-900/40 transition-all duration-300 group">
                                                    <div className="flex items-center gap-5 min-w-0">
                                                        <div className="font-mono text-[10px] text-zinc-700 group-hover:text-white transition-colors shrink-0 flex flex-col items-center">
                                                            <span className="opacity-40 mb-0.5">TS</span>
                                                            {item.study_sessions_count}
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className="font-medium text-zinc-200 text-sm truncate">{item.subtopic_title}</span>
                                                            <span className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                                                                {item.planet_title} / {item.galaxy_title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 shrink-0 font-mono text-xs font-bold text-white bg-white/5 border border-white/10 px-2.5 py-1 rounded">
                                                        {timeString}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-black/20">
                                        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest-xl mb-2">No study sessions yet</p>
                                        <p className="text-zinc-700 text-[10px] font-mono tracking-widest opacity-60">Start tracking study time on the map to see data here</p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats — 1/3 width */}
                            <div className="bg-zinc-900/10 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col gap-6 shadow-panel">
                                <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-widest-xl uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                    Quick Stats
                                </h3>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-xs font-mono uppercase tracking-widest-xl">Time Studied</span>
                                        <span className="text-white font-extrabold text-xl tabular-nums">{studyTimeDisplay}</span>
                                    </div>
                                    <div className="w-full h-px bg-white/5" />
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest-xl mb-1 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            Active Goals
                                        </p>
                                        <p className="text-xl font-bold text-zinc-200 tracking-tight">{stats.roadmaps_count} sequences</p>
                                    </div>
                                    <div className="w-full h-px bg-white/5" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-xs font-mono uppercase tracking-widest-xl">Total Topics</span>
                                        <span className="text-zinc-300 font-extrabold text-xl tabular-nums">{totalModules}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5">
                                    <Link
                                        href="/roadmaps"
                                        className="block text-center text-[10px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-widest-xl transition-colors"
                                    >
                                        Mission Archives →
                                    </Link>
                                </div>
                            </div>

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
