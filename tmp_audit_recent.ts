import { Pool } from 'pg';

const DATABASE_URL = "postgres://postgres:guru@localhost:5432/pathpilot_v2";
const db = new Pool({ connectionString: DATABASE_URL });

async function auditMostRecentUser() {
    try {
        console.log('--- MOST RECENT SESSION AUDIT ---');

        // Find the user who has the most recent session
        const recentSession = await db.query(`
            SELECT user_id, started_at, ended_at, duration_seconds, subtopic_id 
            FROM study_sessions 
            ORDER BY started_at DESC 
            LIMIT 5
        `);
        console.log('Recent sessions across all users:', JSON.stringify(recentSession.rows, null, 2));

        if (recentSession.rows.length > 0) {
            const userId = recentSession.rows[0].user_id;
            console.log(`Auditing user: ${userId}`);

            const statsRes = await db.query(`
                SELECT 
                    COALESCE(SUM(duration_seconds), 0)::INTEGER as total_seconds,
                    COUNT(*)::INTEGER as total_sessions
                FROM study_sessions 
                WHERE user_id = $1
            `, [userId]);
            console.log('Stats for this user:', JSON.stringify(statsRes.rows[0], null, 2));

            const nullDurations = await db.query(`
                SELECT COUNT(*) FROM study_sessions WHERE user_id = $1 AND duration_seconds IS NULL
            `, [userId]);
            console.log('Sessions with NULL duration (not ended):', nullDurations.rows[0].count);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
        process.exit();
    }
}

auditMostRecentUser();
