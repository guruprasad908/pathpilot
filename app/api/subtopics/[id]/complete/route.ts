import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;
        const resolvedParams = await params;
        const subtopicId = resolvedParams.id;

        // Verify the subtopic belongs to this user (via roadmap ownership)
        const ownershipCheck = await db.query(`
            SELECT s.id
            FROM subtopics s
            JOIN planets p ON s.planet_id = p.id
            JOIN galaxies g ON p.galaxy_id = g.id
            JOIN roadmaps r ON g.roadmap_id = r.id
            WHERE s.id = $1 AND r.user_id = $2
        `, [subtopicId, userId]);

        if (ownershipCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Subtopic not found or unauthorized' }, { status: 404 });
        }

        // Upsert progress row — mark as completed
        await db.query(`
            INSERT INTO subtopic_progress (user_id, subtopic_id, status, percent_done, updated_at)
            VALUES ($1, $2, 'completed', 100, NOW())
            ON CONFLICT (user_id, subtopic_id)
            DO UPDATE SET 
                status = 'completed', 
                percent_done = 100, 
                updated_at = NOW()
        `, [userId, subtopicId]);

        return NextResponse.json({
            success: true,
            subtopicId,
            newStatus: 'completed'
        });

    } catch (error) {
        console.error('Failed to mark subtopic complete:', error);
        return NextResponse.json({ error: 'Failed to mark complete' }, { status: 500 });
    }
}
