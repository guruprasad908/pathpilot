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

        // Lightweight projection query computing completion % purely in SQL
        const result = await db.query(`
            SELECT 
                r.id, 
                r.title, 
                r.created_at,
                r.updated_at,
                COUNT(s.id) as total_modules,
                COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) as completed_modules,
                CASE 
                    WHEN COUNT(s.id) > 0 THEN ROUND((COUNT(CASE WHEN sp.status = 'completed' THEN 1 END)::numeric / COUNT(s.id)::numeric) * 100)
                    ELSE 0 
                END as completion_percent,
                (SELECT active_roadmap_id FROM users WHERE id = $1) = r.id as is_active
            FROM roadmaps r
            LEFT JOIN galaxies g ON g.roadmap_id = r.id
            LEFT JOIN planets p ON p.galaxy_id = g.id
            LEFT JOIN subtopics s ON s.planet_id = p.id
            LEFT JOIN subtopic_progress sp ON sp.subtopic_id = s.id AND sp.user_id = $1
            WHERE r.user_id = $1
            GROUP BY r.id, r.title, r.created_at, r.updated_at
            ORDER BY r.created_at DESC
        `, [userId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch all roadmaps:', error);
        return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
    }
}
