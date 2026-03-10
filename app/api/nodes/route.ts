import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

// POST: Add a new child node to a parent
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roadmapId, parentId, title, description } = await req.json();

        if (!roadmapId || !title) {
            return NextResponse.json({ error: 'roadmapId and title are required' }, { status: 400 });
        }

        // Verify roadmap ownership
        const ownershipCheck = await db.query(`SELECT user_id FROM roadmaps WHERE id = $1`, [roadmapId]);
        if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== session.user_id) {
            return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });
        }

        // Get depth of the parent to set depth of the new node
        let depth = 0;
        if (parentId) {
            const parentRes = await db.query(`SELECT depth FROM roadmap_nodes WHERE id = $1`, [parentId]);
            if (parentRes.rows.length > 0) {
                depth = parentRes.rows[0].depth + 1;
            }
        }

        // Get next order index
        const orderRes = await db.query(
            `SELECT COALESCE(MAX(order_index), -1) + 1 as next_index FROM roadmap_nodes WHERE roadmap_id = $1 AND COALESCE(parent_id, '00000000-0000-0000-0000-000000000000') = COALESCE($2, '00000000-0000-0000-0000-000000000000')`,
            [roadmapId, parentId]
        );
        const nextIndex = orderRes.rows[0].next_index;

        // Insert new node
        const insertRes = await db.query(
            `INSERT INTO roadmap_nodes (roadmap_id, parent_id, title, description, depth, order_index, is_leaf)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
            [roadmapId, parentId, title, description || null, depth, nextIndex]
        );

        // Update parent is_leaf flag
        if (parentId) {
            await db.query(`UPDATE roadmap_nodes SET is_leaf = FALSE WHERE id = $1`, [parentId]);
        }

        return NextResponse.json({ success: true, nodeId: insertRes.rows[0].id });
    } catch (error) {
        console.error('Failed to create node:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
