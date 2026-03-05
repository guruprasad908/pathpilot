require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:guru@localhost:5432/pathpilot_v2';
const pool = new Pool({ connectionString: databaseUrl });

async function runSchema() {
    const schemaSql = fs.readFileSync('./db/schema_phase12.sql', 'utf8');
    try {
        console.log('Running db/schema_phase12.sql...');
        await pool.query(schemaSql);
        console.log('✅ Phase 12 Schema executed successfully.');
    } catch (err) {
        console.error('❌ Failed to execute schema:', err.message);
    } finally {
        pool.end();
    }
}

runSchema();
