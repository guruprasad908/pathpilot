-- Audit & Profile Overhaul Migration

-- 1. Create user_profiles table for personal identity data
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

-- 2. Add onboarding completion flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- 3. Optimization: Index for study session aggregation
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id_duration ON study_sessions(user_id, duration_seconds) WHERE duration_seconds IS NOT NULL;

-- 4. Trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_modtime 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
