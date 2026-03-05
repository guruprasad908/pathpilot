import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;
        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;

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
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        const roadmapsMap = new Map();

        result.rows.forEach(row => {
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
                            subtopics: [],
                            deepDiveCount: 0 // Track for challenging planet heuristic
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
                    isChallenging: planet.deepDiveCount >= 2 // Constraint: 2+ flagged subtopics
                }))
            }))
        }));

        // Return just the single roadmap
        return NextResponse.json(nestedData[0]);
    } catch (error) {
        const err = error as Error;
        console.error('Failed to fetch roadmaps:', err);
        return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title } = await req.json();
        if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });

        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;
        const userId = session.user_id;

        // Verify ownership and update
        const result = await db.query(
            `UPDATE roadmaps SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id`,
            [title, roadmapId, userId]
        );

        if (result.rows.length === 0) return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Roadmap renamed successfully' });
    } catch (error) {
        console.error('Failed to rename roadmap:', error);
        return NextResponse.json({ error: 'Failed to rename roadmap' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;
        const userId = session.user_id;

        // 1. Verify ownership by checking if the roadmap exists for this user
        const checkRes = await db.query(`SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2`, [roadmapId, userId]);
        if (checkRes.rows.length === 0) return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });

        // 2. Delete the roadmap (ON DELETE CASCADE handles galaxies, planets, subtopics, and progress)
        await db.query(`DELETE FROM roadmaps WHERE id = $1`, [roadmapId]);

        // 3. Safe reassignment: check if user currently has an active roadmap (ON DELETE SET NULL would have made it null if it was the one deleted)
        // Let's get the user's current active_roadmap_id
        const userRes = await db.query(`SELECT active_roadmap_id FROM users WHERE id = $1`, [userId]);

        if (!userRes.rows[0].active_roadmap_id) {
            // If it's null, it means we either just deleted the active one, or they didn't have one.
            // Let's try to assign another roadmap of theirs to be active.
            const nextRes = await db.query(`SELECT id FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
            if (nextRes.rows.length > 0) {
                await db.query(`UPDATE users SET active_roadmap_id = $1 WHERE id = $2`, [nextRes.rows[0].id, userId]);
            }
        }

        return NextResponse.json({ success: true, message: 'Roadmap deleted securely' });
    } catch (error) {
        console.error('Failed to delete roadmap:', error);
        return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
    }
}
