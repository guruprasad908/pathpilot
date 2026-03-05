import { Pool } from 'pg';
import { env } from './env';

// Create a single global pool to prevent connection exhaustion in dev
// Next.js fast-refresh can create multiple connections otherwise.
const globalForPg = global as unknown as { pgPool: Pool };

export const db =
    globalForPg.pgPool ||
    new Pool({
        connectionString: env.DATABASE_URL,
        // Add SSL support only if we are using Supabase or production hosts requiring it
        ssl: env.DATABASE_URL.includes('supabase.com')
            ? { rejectUnauthorized: false }
            : undefined,
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPg.pgPool = db;
}
