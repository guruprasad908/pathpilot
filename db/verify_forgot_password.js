require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifyFlow() {
    const testEmail = 'test@example.com';
    const testPassword = 'new-secure-password';

    try {
        console.log('--- STARTING FORGOT PASSWORD VERIFICATION ---');

        // 1. Ensure test user exists
        console.log('1. Ensuring test user exists...');
        await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [testEmail, 'dummy-hash']);

        // 2. Simulate forgot password request (API logic internally)
        console.log('2. Simulating forgot password request...');
        const token = 'test-token-' + Date.now();
        const expires = new Date(Date.now() + 3600000);
        await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3', [token, expires, testEmail]);

        // 3. Verify token stored
        console.log('3. Verifying token storage...');
        const checkToken = await pool.query('SELECT reset_token FROM users WHERE email = $1', [testEmail]);
        if (checkToken.rows[0].reset_token !== token) {
            throw new Error('Token mismatch in database');
        }
        console.log('✅ Token stored successfully.');

        // 4. Simulate password reset (API logic internally)
        console.log('4. Simulating password reset...');
        // In a real API call, we'd hash the password. Here we just verify the update logic.
        const newHash = 'new-dummy-hash';
        await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2', [newHash, token]);

        // 5. Verify password updated and token cleared
        console.log('5. Verifying password update and token clearance...');
        const finalResult = await pool.query('SELECT password_hash, reset_token FROM users WHERE email = $1', [testEmail]);
        if (finalResult.rows[0].password_hash !== newHash) {
            throw new Error('Password hash not updated');
        }
        if (finalResult.rows[0].reset_token !== null) {
            throw new Error('Token not cleared');
        }
        console.log('✅ Password updated and token cleared successfully.');

        console.log('--- VERIFICATION SUCCESSFUL ---');
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    } finally {
        pool.end();
    }
}

verifyFlow();
