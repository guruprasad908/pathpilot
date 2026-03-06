const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:.*@/, ':****@'));

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const start = Date.now();
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful!');
        console.log('Server time:', res.rows[0].now);
        console.log('Latency:', Date.now() - start, 'ms');

        // Check tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('\nFound tables:', tables.rows.map(r => r.table_name).join(', '));

        // Check users table columns
        const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        console.log('\nUsers table columns:');
        columns.rows.forEach(c => console.log(`- ${c.column_name}: ${c.data_type}`));

    } catch (err) {
        console.error('❌ Connection failed!');
        console.error(err);
    } finally {
        await pool.end();
    }
}

test();
