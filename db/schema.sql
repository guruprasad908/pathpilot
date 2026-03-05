-- Phase 2: Simple Roadmap CRUD Schema
-- Run this to build the foundational tables (No AI yet)

-- 1. Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Galaxies (Top-level domains like "Python" or "Data Science")
CREATE TABLE IF NOT EXISTS galaxies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Planets (Core Topics inside a Galaxy)
CREATE TABLE IF NOT EXISTS planets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galaxy_id UUID NOT NULL REFERENCES galaxies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Subtopics (Granular drill-down concepts inside a Planet)
CREATE TABLE IF NOT EXISTS subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planet_id UUID NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roadmaps_modtime BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_galaxies_modtime BEFORE UPDATE ON galaxies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_planets_modtime BEFORE UPDATE ON planets FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subtopics_modtime BEFORE UPDATE ON subtopics FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
