import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = "postgres://postgres:guru@localhost:5432/pathpilot_v2";

const db = new Pool({
    connectionString: DATABASE_URL,
});

async function runMigration() {
    try {
        console.log('--- STARTING MIGRATION ---');
        const migrationPath = path.join('c:', 'pathpilot', 'db', 'migration_audit_fix.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split by ';' and clean up, but be careful with functions/triggers
        // Actually, simple batch execute might work if the driver supports it
        await db.query(sql);

        console.log('Migration executed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await db.end();
        process.exit();
    }
}

runMigration();
