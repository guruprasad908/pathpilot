import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LearningProfileSchema = z.object({
    experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
    pace_preference: z.enum(['slow', 'normal', 'fast']),
    depth_preference: z.enum(['surface', 'balanced', 'deep']),
    daily_time_minutes: z.number().min(5).max(1440),
});

const PersonalProfileSchema = z.object({
    full_name: z.string().min(1),
    gender: z.string().optional(),
    age: z.number().optional(),
    education_level: z.string().optional(),
    learning_goal: z.string().optional(),
    bio: z.string().optional(),
});

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Join learning profile and personal identity profile
        const result = await db.query(`
            SELECT 
                lp.*,
                up.full_name, up.gender, up.age, up.education_level, up.learning_goal, up.bio, up.avatar_url, up.join_date,
                u.has_completed_onboarding
            FROM users u
            LEFT JOIN user_learning_profile lp ON u.id = lp.user_id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = $1
        `, [session.user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ profile: null });
        }

        const data = result.rows[0];

        // If there's no learning profile yet, return null profile so onboarding triggers
        if (!data.experience_level) {
            return NextResponse.json({ profile: null });
        }

        // Calculate additional stats for the profile view
        const statsResult = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM subtopic_progress WHERE user_id = $1 AND status = 'completed')::INTEGER as completed_topics_count,
                (SELECT COALESCE(SUM(duration_seconds), 0) FROM study_sessions WHERE user_id = $1)::INTEGER as total_seconds
        `, [session.user_id]);

        const stats = statsResult.rows[0];

        // Calculate progress for active roadmap
        let activeRoadmapProgress = 0;
        const activeRmRes = await db.query(`SELECT active_roadmap_id FROM users WHERE id = $1`, [session.user_id]);
        const activeId = activeRmRes.rows[0]?.active_roadmap_id;

        if (activeId) {
            // Progress on the active roadmap (at user-interaction level: Depth 2)
            const progressRes = await db.query(`
                WITH roadmap_stats AS (
                    -- Total units at Depth 2 (or leaves if roadmap is shallow)
                    SELECT COUNT(*) as total
                    FROM roadmap_nodes
                    WHERE roadmap_id = $1
                    AND (depth = 2 OR (is_leaf = TRUE AND depth < 2))
                ),
                completed_stats AS (
                    -- Completed units at the same level
                    SELECT COUNT(*) as completed
                    FROM subtopic_progress sp
                    JOIN roadmap_nodes n ON n.id = sp.subtopic_id
                    WHERE sp.user_id = $2
                    AND sp.status = 'completed'
                    AND n.roadmap_id = $1
                    AND (n.depth = 2 OR (n.is_leaf = TRUE AND n.depth < 2))
                )
                SELECT 
                    CASE 
                        WHEN rs.total > 0 THEN ROUND((cs.completed::numeric / rs.total::numeric) * 100)
                        ELSE 0 
                    END as progress
                FROM roadmap_stats rs, completed_stats cs
            `, [activeId, session.user_id]);
            
            activeRoadmapProgress = parseInt(progressRes.rows[0]?.progress || '0', 10);
        }

        return NextResponse.json({ 
            profile: {
                ...data,
                completed_topics_count: stats.completed_topics_count,
                total_seconds: stats.total_seconds,
                active_roadmap_progress: activeRoadmapProgress
            } 
        });
    } catch (error) {
        console.error('Failed to get profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // POST now handles BOTH or ONE of the profile parts
        const learningParsed = LearningProfileSchema.safeParse(body);
        const personalParsed = PersonalProfileSchema.safeParse(body);

        if (!learningParsed.success && !personalParsed.success) {
            return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            if (learningParsed.success) {
                const { experience_level, pace_preference, depth_preference, daily_time_minutes } = learningParsed.data;
                await client.query(`
                    INSERT INTO user_learning_profile (user_id, experience_level, pace_preference, depth_preference, daily_time_minutes)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (user_id) DO UPDATE SET
                        experience_level = EXCLUDED.experience_level,
                        pace_preference = EXCLUDED.pace_preference,
                        depth_preference = EXCLUDED.depth_preference,
                        daily_time_minutes = EXCLUDED.daily_time_minutes,
                        updated_at = NOW()
                `, [session.user_id, experience_level, pace_preference, depth_preference, daily_time_minutes]);
            }

            if (personalParsed.success) {
                const { full_name, gender, age, education_level, learning_goal, bio } = personalParsed.data;
                await client.query(`
                    INSERT INTO user_profiles (user_id, full_name, gender, age, education_level, learning_goal, bio)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id) DO UPDATE SET
                        full_name = EXCLUDED.full_name,
                        gender = EXCLUDED.gender,
                        age = EXCLUDED.age,
                        education_level = EXCLUDED.education_level,
                        learning_goal = EXCLUDED.learning_goal,
                        bio = EXCLUDED.bio,
                        updated_at = NOW()
                `, [session.user_id, full_name, gender, age, education_level, learning_goal, bio]);
            }

            // Always mark onboarding as complete if both are provided or if we already have the other
            // For simplicity, if we save successfully, we update the flag
            await client.query('UPDATE users SET has_completed_onboarding = TRUE WHERE id = $1', [session.user_id]);

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
