import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getSession } from '../../../../../lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;
        const userId = session.user_id;

        // Verify ownership first
        const checkRes = await db.query(`SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2`, [roadmapId, userId]);
        if (checkRes.rows.length === 0) return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });

        // Set as active
        await db.query(`UPDATE users SET active_roadmap_id = $1 WHERE id = $2`, [roadmapId, userId]);

        return NextResponse.json({ success: true, message: 'Roadmap set as active mission' });
    } catch (error) {
        console.error('Failed to set active roadmap:', error);
        return NextResponse.json({ error: 'Failed to set active roadmap' }, { status: 500 });
    }
}
