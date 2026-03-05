import { Pool } from 'pg';

const DATABASE_URL = "postgres://postgres:guru@localhost:5432/pathpilot_v2";
const db = new Pool({ connectionString: DATABASE_URL });

async function globalAudit() {
    try {
        const users = await db.query(`
            SELECT 
                u.id, 
                u.email,
                up.full_name,
                COUNT(ss.id) as total_sessions,
                COUNT(ss.ended_at) as ended_sessions,
                SUM(ss.duration_seconds) as total_seconds
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN study_sessions ss ON u.id = ss.user_id
            GROUP BY u.id, u.email, up.full_name
            ORDER BY u.id
        `);
        console.log('Global User Statistics:', JSON.stringify(users.rows, null, 2));

        const recentFull = await db.query(`
            SELECT * FROM study_sessions ORDER BY started_at DESC LIMIT 10
        `);
        console.log('Latest 10 Sessions detail:', JSON.stringify(recentFull.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
        process.exit();
    }
}

globalAudit();
