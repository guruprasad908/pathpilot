CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    active_roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link roadmaps to specific users
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update subtopic_progress to point to the actual users table (it was just TEXT 'test-user-123' before)
-- Since we are mocking minimal, we can just delete old tracking data to migrate cleanly if needed, 
-- or alter the type. But Postgres might complain if types don't match. 
-- For MVP, let's truncate the progress and alter the column to UUID.

TRUNCATE TABLE subtopic_progress;
ALTER TABLE subtopic_progress DROP COLUMN IF EXISTS user_id;
ALTER TABLE subtopic_progress ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL;

-- Re-add the unique constraint that was referencing the old user_id
ALTER TABLE subtopic_progress DROP CONSTRAINT IF EXISTS subtopic_progress_user_id_subtopic_id_key;
ALTER TABLE subtopic_progress ADD CONSTRAINT subtopic_progress_user_id_subtopic_id_key UNIQUE (user_id, subtopic_id);
