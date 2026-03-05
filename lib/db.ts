import { Pool } from 'pg';
import { env } from './env';

// Create a single global pool to prevent connection exhaustion in dev
// Next.js fast-refresh can create multiple connections otherwise.
const globalForPg = global as unknown as { pgPool: Pool };

export const db =
    globalForPg.pgPool ||
    new Pool({
        connectionString: env.DATABASE_URL,
        // Enable SSL for Supabase and any non-local production database
        ssl: (env.DATABASE_URL.includes('supabase.co') || env.DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production')
            ? { rejectUnauthorized: false }
            : undefined,
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPg.pgPool = db;
}
