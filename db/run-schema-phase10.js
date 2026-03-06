require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set in .env.local');
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const sqlPath = path.join(__dirname, 'schema_phase10_syllabus.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running Phase 10 Migration (Syllabus Data)...');
        await client.query(sql);

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
        process.exit();
    }
}

runMigration();
