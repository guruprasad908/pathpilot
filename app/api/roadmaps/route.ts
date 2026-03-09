import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;

        // Get the active roadmap
        const roadmapCheck = await db.query(`
            SELECT r.id, r.title 
            FROM roadmaps r
            JOIN users u ON u.id = $1 AND r.id = u.active_roadmap_id
        `, [userId]);

        if (roadmapCheck.rows.length === 0) {
            return NextResponse.json([]);
        }

        const roadmap = roadmapCheck.rows[0];

        // Fetch all nodes + progress
        const result = await db.query(`
            SELECT 
                n.id, n.parent_id, n.title, n.description, n.depth, n.order_index, n.is_leaf,
                sp.status as progress_status, sp.percent_done
            FROM roadmap_nodes n
            LEFT JOIN subtopic_progress sp ON sp.subtopic_id = n.id AND sp.user_id = $1
            WHERE n.roadmap_id = $2
            ORDER BY n.depth ASC, n.order_index ASC
        `, [userId, roadmap.id]);

        // Build tree in memory
        const nodesById = new Map<string, any>();
        const rootNodes: any[] = [];

        for (const row of result.rows) {
            nodesById.set(row.id, {
                id: row.id,
                parentId: row.parent_id,
                title: row.title,
                description: row.description,
                depth: row.depth,
                orderIndex: row.order_index,
                isLeaf: row.is_leaf,
                status: row.progress_status || 'not_started',
                percentDone: row.percent_done || 0,
                children: []
            });
        }

        for (const node of nodesById.values()) {
            if (node.parentId && nodesById.has(node.parentId)) {
                nodesById.get(node.parentId).children.push(node);
            } else if (!node.parentId) {
                rootNodes.push(node);
            }
        }

        return NextResponse.json([{
            id: roadmap.id,
            title: roadmap.title,
            children: rootNodes
        }]);

    } catch (error) {
        const err = error as Error;
        console.error('Failed to fetch roadmaps:', err);
        return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
    }
}
