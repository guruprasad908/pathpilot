import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '../../components/NavBar';
import MissionLog from './MissionLog';
import { getSession } from '../../lib/auth';
import { db } from '../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Roadmaps' };

export default async function RoadmapsPage() {
    const userData = await getSession();
    if (!userData) redirect('/login');
    const userId = userData.user_id;

    // Lightweight projection query computing completion % purely in SQL
    const result = await db.query(`
        SELECT 
            r.id, 
            r.title, 
            r.created_at,
            r.updated_at,
            COUNT(s.id) as total_modules,
            COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) as completed_modules,
            CASE 
                WHEN COUNT(s.id) > 0 THEN ROUND((COUNT(CASE WHEN sp.status = 'completed' THEN 1 END)::numeric / COUNT(s.id)::numeric) * 100)
                ELSE 0 
            END as completion_percent,
            (SELECT active_roadmap_id FROM users WHERE id = $1) = r.id as is_active
        FROM roadmaps r
        LEFT JOIN galaxies g ON g.roadmap_id = r.id
        LEFT JOIN planets p ON p.galaxy_id = g.id
        LEFT JOIN subtopics s ON s.planet_id = p.id
        LEFT JOIN subtopic_progress sp ON sp.subtopic_id = s.id AND sp.user_id = $1
        WHERE r.user_id = $1
        GROUP BY r.id, r.title, r.created_at, r.updated_at
        ORDER BY r.created_at DESC
    `, [userId]);

    const roadmaps = result.rows;

    return (
        <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 font-display">
            <NavBar />

            <div className="container-standard py-[var(--spacing-sys-2xl)]">
                <header className="mb-12 border-b border-white/5 pb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 font-display">
                            Mission <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Archives</span>
                        </h1>
                        <p className="text-zinc-500 text-lg max-w-2xl leading-relaxed font-light">
                            All initialized learning sequences. Execute a sequence to explore its trajectory, or set it as active for the primary mission HUD.
                        </p>
                    </div>
                </header>

                <main className="flex flex-col gap-[var(--space-5)]">
                    <MissionLog initialRoadmaps={roadmaps} />
                </main>
            </div>
        </div>
    );
}
