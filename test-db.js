require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:guru@localhost:5432/pathpilot_v2';
const pool = new Pool({ connectionString: databaseUrl });

console.log(`Testing connection to: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
    }
    pool.end();
});
