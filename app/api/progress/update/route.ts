import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { z } from 'zod';

// Define the incoming request schema
const ProgressUpdateSchema = z.object({
    subtopic_id: z.string().uuid(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
    percent_done: z.number().min(0).max(100).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate request body
        const parsed = ProgressUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
        }

        const { subtopic_id, status } = parsed.data;
        const percent_done = parsed.data.percent_done ?? (status === 'completed' ? 100 : 0);

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user_id = session.user_id;

        // --- SECURITY: Verify node belongs to this user via roadmap ownership ---
        const ownershipCheck = await db.query(`
            SELECT n.id
            FROM roadmap_nodes n
            JOIN roadmaps r ON n.roadmap_id = r.id
            WHERE n.id = $1 AND r.user_id = $2
        `, [subtopic_id, user_id]);

        if (ownershipCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Subtopic not found or unauthorized' }, { status: 403 });
        }

        // UPSERT into Postgres: Insert new or Update if (user_id, subtopic_id) exists
        const result = await db.query(`
      INSERT INTO subtopic_progress (user_id, subtopic_id, status, percent_done)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, subtopic_id) 
      DO UPDATE SET 
        status = EXCLUDED.status, 
        percent_done = EXCLUDED.percent_done,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `, [user_id, subtopic_id, status, percent_done]);

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to update progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
