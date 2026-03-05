import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- In-memory Rate Limiter ---
// Uses a Map<IP_endpoint_key, { count, resetAt }>
// This is sufficient for single-instance deployments.
// For multi-instance/serverless (e.g., Vercel), replace this with a Redis-backed solution like Upstash.

interface RateRecord {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateRecord>();

const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    '/api/auth/login': { maxRequests: 10, windowMs: 60_000 },   // 10 / min
    '/api/auth/register': { maxRequests: 5, windowMs: 60_000 },   // 5 / min
    '/api/auth/forgot-password': { maxRequests: 3, windowMs: 60_000 },   // 3 / min
};

function getRateLimitKey(ip: string, path: string): string {
    return `${ip}:${path}`;
}

function isRateLimited(ip: string, path: string): boolean {
    const rule = RATE_LIMITS[path];
    if (!rule) return false;

    const key = getRateLimitKey(ip, path);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
        return false;
    }

    if (record.count >= rule.maxRequests) {
        return true; // Limit exceeded
    }

    record.count += 1;
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply rate limiting to auth routes
    if (RATE_LIMITS[pathname]) {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        if (isRateLimited(ip, pathname)) {
            return new NextResponse(
                JSON.stringify({ error: 'Too many requests. Please slow down.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    },
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    // Only run middleware on these specific paths to keep it performant
    matcher: [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
    ],
};
