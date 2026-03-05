import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '../../../../lib/auth';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const result = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create JWT Session
        await createSession(user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
