import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

// PATCH: Update node title/description
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { title, description } = await req.json();

        // Verify roadmap ownership through the node
        const ownershipCheck = await db.query(`
            SELECT r.user_id 
            FROM roadmap_nodes n 
            JOIN roadmaps r ON n.roadmap_id = r.id 
            WHERE n.id = $1
        `, [id]);

        if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== session.user_id) {
            return NextResponse.json({ error: 'Node not found or unauthorized' }, { status: 404 });
        }

        await db.query(
            `UPDATE roadmap_nodes SET title = $1, description = $2 WHERE id = $3`,
            [title, description || null, id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update node:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove node and its recursive children
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Verify ownership
        const ownershipCheck = await db.query(`
            SELECT r.user_id, n.parent_id, n.roadmap_id 
            FROM roadmap_nodes n 
            JOIN roadmaps r ON n.roadmap_id = r.id 
            WHERE n.id = $1
        `, [id]);

        if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== session.user_id) {
            return NextResponse.json({ error: 'Node not found or unauthorized' }, { status: 404 });
        }

        const { parent_id, roadmap_id } = ownershipCheck.rows[0];

        // Delete the node (Cascading delete in DB schema will handle children)
        await db.query(`DELETE FROM roadmap_nodes WHERE id = $1`, [id]);

        // If the parent now has no children, set it back to a leaf
        if (parent_id) {
            const childCheck = await db.query(`SELECT id FROM roadmap_nodes WHERE parent_id = $1 LIMIT 1`, [parent_id]);
            if (childCheck.rows.length === 0) {
                await db.query(`UPDATE roadmap_nodes SET is_leaf = TRUE WHERE id = $1`, [parent_id]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete node:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
