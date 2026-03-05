-- Phase 4: Basic Progress Tracking Schema

-- Create ENUM for progress status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status_enum') THEN
        CREATE TYPE progress_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
END
$$;

-- Create subtopic_progress table
CREATE TABLE IF NOT EXISTS subtopic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- hardcoded string for now
    subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    status progress_status_enum NOT NULL DEFAULT 'not_started',
    percent_done INTEGER NOT NULL DEFAULT 0 CHECK (percent_done >= 0 AND percent_done <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subtopic_id) -- Ensures we can upsert easily
);

-- Trigger for updated_at timestamps
CREATE TRIGGER update_subtopic_progress_modtime 
BEFORE UPDATE ON subtopic_progress 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
