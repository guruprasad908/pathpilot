CREATE TABLE IF NOT EXISTS user_learning_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    pace_preference TEXT NOT NULL CHECK (pace_preference IN ('slow', 'normal', 'fast')),
    depth_preference TEXT NOT NULL CHECK (depth_preference IN ('surface', 'balanced', 'deep')),
    daily_time_minutes INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
