import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        // Fetch aggregate study statistics
        // duration_seconds is stored as INTEGER, so it might need casting or SUM handling
        const statsRes = await db.query(`
            SELECT 
                COALESCE(SUM(duration_seconds), 0)::INTEGER as total_seconds,
                COUNT(*)::INTEGER as total_sessions,
                (SELECT COUNT(*) FROM subtopic_progress WHERE user_id = $1 AND status = 'completed')::INTEGER as completed_topics_count
            FROM study_sessions 
            WHERE user_id = $1 AND duration_seconds IS NOT NULL
        `, [userId]);

        const stats = statsRes.rows[0];

        return NextResponse.json({
            success: true,
            totalSeconds: stats.total_seconds,
            sessionsCount: stats.total_sessions,
            completedTopics: stats.completed_topics_count
        });

    } catch (error) {
        console.error('Failed to fetch study stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
