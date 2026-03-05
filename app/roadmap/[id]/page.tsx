import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import GalaxyCard from '../../../components/GalaxyCard';
import { getSession } from '../../../lib/auth';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export default async function RoadmapStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
        redirect('/login');
    }

    const resolvedParams = await params;
    const roadmapId = resolvedParams.id;
    const userData = await getSession();
    if (!userData) redirect('/login');
    const userId = userData.user_id;

    // Direct database query for a single roadmap (mirrors logic from api/roadmaps/[id]/route.ts)
    const result = await db.query(`
        WITH user_avg AS (
            SELECT 
                COALESCE(AVG(subtopic_total), 0) as avg_time
            FROM (
                SELECT subtopic_id, SUM(duration_seconds) as subtopic_total
                FROM study_sessions
                WHERE user_id = $1
                GROUP BY subtopic_id
            ) as totals
        ),
        session_stats AS (
            SELECT 
                subtopic_id,
                SUM(duration_seconds) as total_time,
                COUNT(id) as session_count
            FROM study_sessions
            WHERE user_id = $1
            GROUP BY subtopic_id
        )
        SELECT 
            r.id as roadmap_id, r.title as roadmap_title,
            g.id as galaxy_id, g.title as galaxy_title,
            p.id as planet_id, p.title as planet_title, p.order_index as planet_order,
            s.id as subtopic_id, s.title as subtopic_title, s.order_index as subtopic_order,
            sp.status as progress_status, sp.percent_done,
            COALESCE(st.total_time, 0) as total_time,
            COALESCE(st.session_count, 0) as session_count,
            CASE 
                WHEN (COALESCE(st.total_time, 0) > 300 AND COALESCE(st.total_time, 0) > 2.5 * (SELECT avg_time FROM user_avg)) THEN true
                WHEN (COALESCE(st.session_count, 0) > 3 AND COALESCE(sp.status, 'not_started') != 'completed') THEN true
                ELSE false
            END as is_deep_dive
        FROM roadmaps r
        LEFT JOIN galaxies g ON g.roadmap_id = r.id
        LEFT JOIN planets p ON p.galaxy_id = g.id
        LEFT JOIN subtopics s ON s.planet_id = p.id
        LEFT JOIN subtopic_progress sp ON sp.subtopic_id = s.id AND sp.user_id = $1
        LEFT JOIN session_stats st ON st.subtopic_id = s.id
        WHERE r.id = $2 AND r.user_id = $1
        ORDER BY r.created_at DESC, g.created_at ASC, p.order_index ASC, s.order_index ASC
    `, [userId, roadmapId]);

    if (result.rows.length === 0) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
                <NavBar />
                <div className="flex-1 flex items-center justify-center w-full">
                    <div className="text-red-400 p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
                        Roadmap not found or unauthorized access.
                    </div>
                </div>
            </div>
        );
    }

    const roadmapsMap = new Map();

    result.rows.forEach((row: any) => {
        if (!roadmapsMap.has(row.roadmap_id)) {
            roadmapsMap.set(row.roadmap_id, {
                id: row.roadmap_id,
                title: row.roadmap_title,
                galaxies: new Map()
            });
        }
        const roadmapNode = roadmapsMap.get(row.roadmap_id);

        if (row.galaxy_id) {
            if (!roadmapNode.galaxies.has(row.galaxy_id)) {
                roadmapNode.galaxies.set(row.galaxy_id, {
                    id: row.galaxy_id,
                    title: row.galaxy_title,
                    planets: new Map()
                });
            }
            const galaxy = roadmapNode.galaxies.get(row.galaxy_id);

            if (row.planet_id) {
                if (!galaxy.planets.has(row.planet_id)) {
                    galaxy.planets.set(row.planet_id, {
                        id: row.planet_id,
                        title: row.planet_title,
                        orderIndex: row.planet_order,
                        subtopics: [],
                        deepDiveCount: 0
                    });
                }
                const planet = galaxy.planets.get(row.planet_id);

                if (row.subtopic_id) {
                    planet.subtopics.push({
                        id: row.subtopic_id,
                        title: row.subtopic_title,
                        orderIndex: row.subtopic_order,
                        status: row.progress_status || 'not_started',
                        percentDone: row.percent_done || 0,
                        totalTime: row.total_time,
                        sessionCount: parseInt(row.session_count, 10),
                        isDeepDive: row.is_deep_dive
                    });

                    if (row.is_deep_dive) {
                        planet.deepDiveCount += 1;
                    }
                }
            }
        }
    });

    const nestedData = Array.from(roadmapsMap.values()).map((roadmap: any) => ({
        ...roadmap,
        galaxies: Array.from(roadmap.galaxies.values()).map((galaxy: any) => ({
            ...galaxy,
            planets: Array.from(galaxy.planets.values()).map((planet: any) => ({
                ...planet,
                isChallenging: planet.deepDiveCount >= 2
            }))
        }))
    }));

    const roadmap = nestedData[0];

    return (
        <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 font-display">
            <NavBar />

            <div className="container-standard py-[var(--spacing-sys-2xl)]">
                <header className="mb-[var(--space-5)] border-b border-[var(--color-galaxy-border)] pb-[var(--spacing-sys-lg)] flex flex-col gap-[var(--spacing-sys-md)]">
                    <div className="inline-block px-[var(--spacing-sys-md)] py-[var(--spacing-sys-sm)] bg-white/5 text-white text-sm font-semibold rounded-full border border-white/10 w-max">
                        Active Study Module
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                        {roadmap.title}
                    </h1>
                </header>

                <main className="flex flex-col gap-[var(--space-5)]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />
                        <div className="space-y-12">
                            {roadmap.galaxies.map((galaxy: any) => (
                                <GalaxyCard key={galaxy.id} galaxy={galaxy} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
