import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        const body = await req.json();
        const { title, children } = body;

        if (!title || !children || !Array.isArray(children)) {
            return NextResponse.json({ error: 'Invalid roadmap structure' }, { status: 400 });
        }

        // Insert roadmap
        const rRes = await db.query(
            `INSERT INTO roadmaps (title, user_id) VALUES ($1, $2) RETURNING id`,
            [title, userId]
        );
        const roadmapId = rRes.rows[0].id;

        // Set as active roadmap
        await db.query(`UPDATE users SET active_roadmap_id = $1 WHERE id = $2`, [roadmapId, userId]);

        // Recursive function to insert tree nodes
        async function insertNodes(nodes: any[], parentId: string | null, depth: number) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const isLeaf = !node.children || node.children.length === 0;

                const nRes = await db.query(
                    `INSERT INTO roadmap_nodes (roadmap_id, parent_id, title, description, depth, order_index, is_leaf)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [roadmapId, parentId, node.title, node.description || null, depth, i, isLeaf]
                );
                const nodeId = nRes.rows[0].id;

                // Recurse into children
                if (node.children && node.children.length > 0) {
                    await insertNodes(node.children, nodeId, depth + 1);
                }
            }
        }

        await insertNodes(children, null, 0);

        return NextResponse.json({ success: true, roadmapId });

    } catch (error) {
        console.error('Failed to save roadmap:', error);
        return NextResponse.json({ error: 'Failed to save roadmap' }, { status: 500 });
    }
}
