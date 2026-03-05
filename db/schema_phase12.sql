-- Phase 12: Study Intelligence

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER
);

-- Indexes for fast heuristic queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subtopic ON study_sessions(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_subtopic ON study_sessions(user_id, subtopic_id);
