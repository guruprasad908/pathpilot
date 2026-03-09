import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';
import { revalidatePath } from 'next/cache';

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

        // Verify the node belongs to this user (via roadmap ownership)
        const ownershipCheck = await db.query(`
            SELECT n.id
            FROM roadmap_nodes n
            JOIN roadmaps r ON n.roadmap_id = r.id
            WHERE n.id = $1 AND r.user_id = $2
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

        // Revalidate dependent pages to bust cache
        revalidatePath('/dashboard');
        revalidatePath('/profile');
        revalidatePath('/roadmaps');

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
