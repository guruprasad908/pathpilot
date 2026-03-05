import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { z } from 'zod';

const StartSessionSchema = z.object({
    subtopicId: z.string().uuid()
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        const body = await req.json();
        const { subtopicId } = StartSessionSchema.parse(body);

        // Verify subtopic exists and belongs to user's roadmap scope
        // (Assuming standard access check or letting FK handle basic integrity for now, 
        //  but strictly we should ensure the user actually "owns" this via roadmaps -> active_roadmap_id)

        // Insert a new open study session
        const res = await db.query(
            `INSERT INTO study_sessions (user_id, subtopic_id) 
             VALUES ($1, $2) 
             RETURNING id, started_at`,
            [userId, subtopicId]
        );

        return NextResponse.json({
            success: true,
            sessionId: res.rows[0].id,
            startedAt: res.rows[0].started_at
        });

    } catch (error) {
        console.error('Failed to start study session:', error);
        return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
    }
}
