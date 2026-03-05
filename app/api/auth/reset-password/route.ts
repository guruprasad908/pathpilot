import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password || password.length < 6) {
            return NextResponse.json({ error: 'Valid token and new password (min 6 chars) required' }, { status: 400 });
        }

        // Find user with valid token
        const userResult = await db.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        const userId = userResult.rows[0].id;

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password and clear token
        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );

        return NextResponse.json({ success: true, message: 'Password updated successfully. Authorization re-established.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
