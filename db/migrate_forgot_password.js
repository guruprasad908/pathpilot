require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('Starting migration: Adding reset token fields to users table...');

        // Check if columns exist first to avoid errors on re-run
        const checkColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('reset_token', 'reset_token_expires')
        `);

        if (checkColumns.rows.length === 0) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token TEXT,
                ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE
            `);
            console.log('✅ Columns reset_token and reset_token_expires added successfully.');
        } else {
            console.log('ℹ️ Columns already exist. Skipping.');
        }

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        pool.end();
    }
}

migrate();
