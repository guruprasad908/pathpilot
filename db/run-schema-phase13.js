const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('--- Phase 13: Tutorial Integration Migration ---');
        const sql = fs.readFileSync(path.join(__dirname, 'schema_phase13_tutorials.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Migration successful: Tutorial columns added to roadmaps table.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
