-- ═══════════════════════════════════════════════════════════════
-- PathPilot — Master Database Schema for Supabase
-- Run this entire file in Supabase SQL Editor → New Query → RUN
-- ═══════════════════════════════════════════════════════════════

-- ── STEP 1: Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── STEP 2: Shared timestamp trigger function ───────────────────
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ── STEP 3: Core roadmap tables ─────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID,  -- filled in after users table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS galaxies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS planets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galaxy_id UUID NOT NULL REFERENCES galaxies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planet_id UUID NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── STEP 4: Progress status enum ────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status_enum') THEN
        CREATE TYPE progress_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
END
$$;

-- ── STEP 5: Subtopic progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subtopic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    status progress_status_enum NOT NULL DEFAULT 'not_started',
    percent_done INTEGER NOT NULL DEFAULT 0 CHECK (percent_done >= 0 AND percent_done <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── STEP 6: Users table (auth) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    reset_token TEXT,
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    active_roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── STEP 7: Link roadmaps to users ──────────────────────────────
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- ── STEP 8: Link subtopic_progress to users ─────────────────────
ALTER TABLE subtopic_progress ADD COLUMN IF NOT EXISTS user_id_ref UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subtopic_progress DROP CONSTRAINT IF EXISTS subtopic_progress_user_id_subtopic_id_key;
ALTER TABLE subtopic_progress ADD CONSTRAINT subtopic_progress_user_id_subtopic_id_key UNIQUE (user_id, subtopic_id);

-- ── STEP 9: User profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    pace_preference TEXT NOT NULL CHECK (pace_preference IN ('slow', 'normal', 'fast')),
    depth_preference TEXT NOT NULL CHECK (depth_preference IN ('surface', 'balanced', 'deep')),
    daily_time_minutes INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    gender TEXT,
    age INTEGER,
    education_level TEXT,
    learning_goal TEXT,
    bio TEXT,
    avatar_url TEXT,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── STEP 10: Study sessions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER
);

-- ── STEP 11: Performance indexes ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subtopic ON study_sessions(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_subtopic ON study_sessions(user_id, subtopic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id_duration ON study_sessions(user_id, duration_seconds) WHERE duration_seconds IS NOT NULL;

-- ── STEP 12: Auto-update triggers ───────────────────────────────
CREATE TRIGGER update_roadmaps_modtime BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_galaxies_modtime BEFORE UPDATE ON galaxies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_planets_modtime BEFORE UPDATE ON planets FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subtopics_modtime BEFORE UPDATE ON subtopics FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subtopic_progress_modtime BEFORE UPDATE ON subtopic_progress FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_user_profiles_modtime BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ═══════════════════════════════════════════════════════════════
-- Done! All PathPilot tables have been created successfully.
-- ═══════════════════════════════════════════════════════════════
