import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // Return success even if email not found to prevent user enumeration
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been generated.' });
        }

        const userId = userResult.rows[0].id;

        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        // Store token in DB (plain text for simplicity in this prototype, or hash it)
        // Let's store the plain token for easy retrieval in the reset flow for this task
        await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [token, expires, userId]
        );

        // In a real app, send an email. Here we log it.
        const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log('-------------------------------------------');
        console.log('PASSWORD RESET REQUESTED');
        console.log(`Email: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('-------------------------------------------');

        return NextResponse.json({ success: true, message: 'Reset coordinates transmitted. Check system logs.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
