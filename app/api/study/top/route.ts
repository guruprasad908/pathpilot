import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        // Fetch the top 3 nodes the user has spent the most time on
        const result = await db.query(`
            SELECT 
                n.id as subtopic_id,
                n.title as subtopic_title,
                SUM(ss.duration_seconds)::INTEGER as total_time
            FROM study_sessions ss
            JOIN roadmap_nodes n ON ss.subtopic_id = n.id
            WHERE ss.user_id = $1 AND ss.duration_seconds IS NOT NULL
            GROUP BY n.id, n.title
            ORDER BY total_time DESC
            LIMIT 3
        `, [userId]);

        return NextResponse.json({ success: true, topSubtopics: result.rows });

    } catch (error) {
        console.error('Failed to fetch top study sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch top study sessions' }, { status: 500 });
    }
}
