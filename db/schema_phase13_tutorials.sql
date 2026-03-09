-- Phase 13: Tutorial Integration
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS tutorial_video_url TEXT;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS tutorial_video_title VARCHAR(500);
