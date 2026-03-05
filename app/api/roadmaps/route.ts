import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;

        // We use a flat JOIN query to get all related data in one go, including progress.
        // We only fetch the roadmap that matches the user's active_roadmap_id
        const result = await db.query(`
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

        const nestedData = Array.from(roadmapsMap.values()).map(roadmap => ({
            ...roadmap,
            galaxies: Array.from(roadmap.galaxies.values()).map((galaxy: any) => ({
                ...galaxy,
                planets: Array.from(galaxy.planets.values())
            }))
        }));

        return NextResponse.json(nestedData);
    } catch (error) {
        const err = error as Error;
        console.error('Failed to fetch roadmaps:', err);
        return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
    }
}
