import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { z } from 'zod';

// Define the exact schema we expect to receive for a valid roadmap
const RoadmapSchema = z.object({
    title: z.string(),
    rationale: z.string().optional(),
    galaxies: z.array(z.object({
        title: z.string(),
        focus: z.string().optional(),
        planets: z.array(z.object({
            title: z.string(),
            market_relevance: z.string().optional(),
            subtopics: z.array(z.object({
                title: z.string(),
                description: z.string().optional(),
                key_tools: z.array(z.string()).optional()
            }))
        }))
    }))
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        const body = await req.json();

        // Validate incoming structure
        const validatedData = RoadmapSchema.parse(body);

        const { title, galaxies } = validatedData;

        // Insert roadmap and tie it to the user
        const rRes = await db.query(`INSERT INTO roadmaps (title, user_id) VALUES ($1, $2) RETURNING id`, [title, userId]);
        const roadmapId = rRes.rows[0].id;

        // Set this new roadmap as the user's active roadmap
        await db.query(`UPDATE users SET active_roadmap_id = $1 WHERE id = $2`, [roadmapId, userId]);

        for (let i = 0; i < galaxies.length; i++) {
            const gRes = await db.query(
                `INSERT INTO galaxies (roadmap_id, title) VALUES ($1, $2) RETURNING id`,
                [roadmapId, galaxies[i].title]
            );
            const galaxyId = gRes.rows[0].id;

            for (let j = 0; j < galaxies[i].planets.length; j++) {
                const pRes = await db.query(
                    `INSERT INTO planets (galaxy_id, title, order_index) VALUES ($1, $2, $3) RETURNING id`,
                    [galaxyId, galaxies[i].planets[j].title, j]
                );
                const planetId = pRes.rows[0].id;

                for (let k = 0; k < galaxies[i].planets[j].subtopics.length; k++) {
                    await db.query(
                        `INSERT INTO subtopics (planet_id, title, order_index) VALUES ($1, $2, $3)`,
                        [planetId, galaxies[i].planets[j].subtopics[k].title, k]
                    );
                }
            }
        }

        return NextResponse.json({ success: true, roadmapId });

    } catch (error) {
        console.error('Failed to save roadmap:', error);
        return NextResponse.json({ error: 'Failed to save roadmap' }, { status: 500 });
    }
}
