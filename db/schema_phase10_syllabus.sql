-- Expand the subtopics table to store the granular AI syllabus
ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS concepts_to_master JSONB;
