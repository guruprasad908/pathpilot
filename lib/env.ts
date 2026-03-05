import { z } from 'zod';

const envSchema = z.object({
    // Required
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
    APP_URL: z.string().url().default("http://localhost:3000"),

    // Optional for now until we build those features
    NEXTAUTH_SECRET: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsedEnv.error.format(), null, 2)
    );
    process.exit(1);
}

// Export a validated env object
export const env = parsedEnv.data;
