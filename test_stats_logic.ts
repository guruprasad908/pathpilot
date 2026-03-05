import { Pool } from 'pg';

const DATABASE_URL = "postgres://postgres:guru@localhost:5432/pathpilot_v2";
const db = new Pool({ connectionString: DATABASE_URL });

async function testStatsAPI() {
    // We simulate what the API does for a specific user
    const userId = 'bc5a560c-d355-45db-900c-80ea2a48decc'; // From my previous debug run

    try {
        const statsRes = await db.query(`
            SELECT 
                COALESCE(SUM(duration_seconds), 0)::INTEGER as total_seconds,
                COUNT(*)::INTEGER as total_sessions,
                (SELECT COUNT(*) FROM subtopic_progress WHERE user_id = $1 AND status = 'completed')::INTEGER as completed_topics_count
            FROM study_sessions 
            WHERE user_id = $1 AND duration_seconds IS NOT NULL
        `, [userId]);

        const stats = statsRes.rows[0];
        console.log('Simulated API Response:', JSON.stringify({
            success: true,
            totalSeconds: stats.total_seconds,
            sessionsCount: stats.total_sessions,
            completedTopics: stats.completed_topics_count
        }, null, 2));

        const totalHours = (stats.total_seconds / 3600).toFixed(1);
        console.log('Resulting Dashboard totalHours:', totalHours);

    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
        process.exit();
    }
}

testStatsAPI();
