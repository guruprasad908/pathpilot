import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.NEXTAUTH_SECRET;
if (!secretKey) {
    throw new Error(
        '[auth] CRITICAL: NEXTAUTH_SECRET environment variable is not set. ' +
        'Generate one with: openssl rand -base64 32'
    );
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function createSession(userId: string) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ user_id: userId, expires });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expires,
        path: '/',
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
