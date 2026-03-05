import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '../../../../lib/auth';
import { z } from 'zod';

const RegisterSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }
        const { email, password } = parsed.data;

        // Check if user exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, passwordHash]
        );

        const userId = result.rows[0].id;

        // Create session
        await createSession(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 });
    }
}
