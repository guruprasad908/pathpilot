require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runSchema() {
    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema_phase8_profile.sql'), 'utf8');
        console.log('Running db/schema_phase8_profile.sql...');
        await pool.query(schemaSql);
        console.log('✅ Phase 8 Learning Profile Schema executed successfully.');
    } catch (err) {
        console.error('❌ Error executing schema:', err.message);
    } finally {
        pool.end();
    }
}

runSchema();
