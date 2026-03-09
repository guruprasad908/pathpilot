-- ═══════════════════════════════════════════════════════════════
-- Phase V27: Deep Mind Map — Full Database Migration
-- This replaces galaxies/planets/subtopics with a single recursive tree.
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Clean up ALL old data first (site under maintenance, only dev user)
DELETE FROM study_sessions;
DELETE FROM subtopic_progress;
DELETE FROM subtopics;
DELETE FROM planets;
DELETE FROM galaxies;
DELETE FROM roadmaps;

-- STEP 2: Drop old foreign key constraints
ALTER TABLE subtopic_progress DROP CONSTRAINT IF EXISTS subtopic_progress_subtopic_id_fkey;
ALTER TABLE subtopic_progress DROP CONSTRAINT IF EXISTS subtopic_progress_node_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_subtopic_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_node_id_fkey;

-- STEP 3: Create the recursive roadmap_nodes table
CREATE TABLE IF NOT EXISTS roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    depth INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_leaf BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 4: Create indexes for fast tree queries
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap ON roadmap_nodes(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_parent ON roadmap_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_depth ON roadmap_nodes(roadmap_id, depth);

-- STEP 5: Add new FK constraints pointing subtopic_progress and study_sessions to roadmap_nodes
ALTER TABLE subtopic_progress ADD CONSTRAINT subtopic_progress_node_id_fkey 
    FOREIGN KEY (subtopic_id) REFERENCES roadmap_nodes(id) ON DELETE CASCADE;
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_node_id_fkey 
    FOREIGN KEY (subtopic_id) REFERENCES roadmap_nodes(id) ON DELETE CASCADE;

-- STEP 6: Auto-update trigger
DROP TRIGGER IF EXISTS update_roadmap_nodes_modtime ON roadmap_nodes;
CREATE TRIGGER update_roadmap_nodes_modtime 
    BEFORE UPDATE ON roadmap_nodes 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
