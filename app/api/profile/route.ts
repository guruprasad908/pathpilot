import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { z } from 'zod';

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

        return NextResponse.json({ profile: data });
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
