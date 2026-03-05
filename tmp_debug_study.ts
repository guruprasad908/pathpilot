import { Pool } from 'pg';

const DATABASE_URL = "postgres://postgres:guru@localhost:5432/pathpilot_v2";

const db = new Pool({
    connectionString: DATABASE_URL,
});

async function debugStudyTime() {
    try {
        console.log('--- STUDY SESSIONS DEBUG ---');
        const sessions = await db.query('SELECT * FROM study_sessions ORDER BY started_at DESC LIMIT 10');
        console.log('Recent Study Sessions:', JSON.stringify(sessions.rows, null, 2));

        const stats = await db.query('SELECT user_id, SUM(duration_seconds) as total FROM study_sessions WHERE duration_seconds IS NOT NULL GROUP BY user_id');
        console.log('Aggregated Stats per User:', JSON.stringify(stats.rows, null, 2));

        const profiles = await db.query('SELECT id, has_completed_onboarding FROM users');
        console.log('Users Data:', JSON.stringify(profiles.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
        process.exit();
    }
}

debugStudyTime();
