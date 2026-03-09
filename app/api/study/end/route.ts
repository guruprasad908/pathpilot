import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const EndSessionSchema = z.object({
    sessionId: z.string().uuid()
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        const body = await req.json();
        const { sessionId } = EndSessionSchema.parse(body);

        // First, fetch the session to ensure it belongs to the user and isn't already closed
        const checkRes = await db.query(
            `SELECT started_at, ended_at FROM study_sessions WHERE id = $1 AND user_id = $2`,
            [sessionId, userId]
        );

        if (checkRes.rowCount === 0) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
        }

        if (checkRes.rows[0].ended_at !== null) {
            return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
        }

        // Calculate duration and update the row
        const updateRes = await db.query(
            `UPDATE study_sessions 
             SET ended_at = CURRENT_TIMESTAMP, 
                 duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
             WHERE id = $1 AND user_id = $2
             RETURNING id, duration_seconds`,
            [sessionId, userId]
        );

        // Revalidate dependent pages to bust cache
        revalidatePath('/dashboard');
        revalidatePath('/profile');

        return NextResponse.json({
            success: true,
            durationSeconds: updateRes.rows[0].duration_seconds
        });

    } catch (error) {
        console.error('Failed to end study session:', error);
        return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }
}
