import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;
        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;

        // Verify ownership
        const roadmapCheck = await db.query(
            `SELECT id, title FROM roadmaps WHERE id = $1 AND user_id = $2`,
            [roadmapId, userId]
        );
        if (roadmapCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        // Fetch all nodes flat + progress + study data
        const result = await db.query(`
            WITH session_stats AS (
                SELECT 
                    subtopic_id as node_id,
                    SUM(duration_seconds) as total_time,
                    COUNT(id) as session_count
                FROM study_sessions
                WHERE user_id = $1
                GROUP BY subtopic_id
            )
            SELECT 
                n.id, n.parent_id, n.title, n.description, n.depth, n.order_index, n.is_leaf,
                sp.status as progress_status,
                COALESCE(st.total_time, 0) as total_time,
                COALESCE(st.session_count, 0) as session_count
            FROM roadmap_nodes n
            LEFT JOIN subtopic_progress sp ON sp.subtopic_id = n.id AND sp.user_id = $1
            LEFT JOIN session_stats st ON st.node_id = n.id
            WHERE n.roadmap_id = $2
            ORDER BY n.depth ASC, n.order_index ASC
        `, [userId, roadmapId]);

        // Build the tree in memory
        const nodesById = new Map<string, any>();
        const rootNodes: any[] = [];

        // First pass: create node objects
        for (const row of result.rows) {
            const node: any = {
                id: row.id,
                parentId: row.parent_id,
                title: row.title,
                description: row.description,
                depth: row.depth,
                orderIndex: row.order_index,
                isLeaf: row.is_leaf,
                status: row.progress_status || 'not_started',
                totalTime: parseInt(row.total_time, 10) || 0,
                sessionCount: parseInt(row.session_count, 10) || 0,
                children: []
            };
            nodesById.set(node.id, node);
        }

        // Second pass: assemble tree
        for (const node of nodesById.values()) {
            if (node.parentId && nodesById.has(node.parentId)) {
                nodesById.get(node.parentId).children.push(node);
            } else if (!node.parentId) {
                rootNodes.push(node);
            }
        }

        return NextResponse.json({
            id: roadmapCheck.rows[0].id,
            title: roadmapCheck.rows[0].title,
            children: rootNodes
        });

    } catch (error) {
        const err = error as Error;
        console.error('Failed to fetch roadmap:', err);
        return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title } = await req.json();
        if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });

        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;
        const userId = session.user_id;

        const result = await db.query(
            `UPDATE roadmaps SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id`,
            [title, roadmapId, userId]
        );

        if (result.rows.length === 0) return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Roadmap renamed successfully' });
    } catch (error) {
        console.error('Failed to rename roadmap:', error);
        return NextResponse.json({ error: 'Failed to rename roadmap' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const roadmapId = resolvedParams.id;
        const userId = session.user_id;

        const checkRes = await db.query(`SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2`, [roadmapId, userId]);
        if (checkRes.rows.length === 0) return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 });

        await db.query(`DELETE FROM roadmaps WHERE id = $1`, [roadmapId]);

        const userRes = await db.query(`SELECT active_roadmap_id FROM users WHERE id = $1`, [userId]);
        if (!userRes.rows[0].active_roadmap_id) {
            const nextRes = await db.query(`SELECT id FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
            if (nextRes.rows.length > 0) {
                await db.query(`UPDATE users SET active_roadmap_id = $1 WHERE id = $2`, [nextRes.rows[0].id, userId]);
            }
        }

        return NextResponse.json({ success: true, message: 'Roadmap deleted securely' });
    } catch (error) {
        console.error('Failed to delete roadmap:', error);
        return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
    }
}
