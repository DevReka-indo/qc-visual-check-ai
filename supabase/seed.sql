-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create users/profiles table
-- This links to Supabase Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    employee_id TEXT UNIQUE,
    role TEXT DEFAULT 'System Operator',
    division_id UUID REFERENCES divisions(id),
    avatar_url TEXT,
    status TEXT DEFAULT 'Offline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id TEXT NOT NULL,
    division_id UUID REFERENCES divisions(id),
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    image_url TEXT,
    ai_result_status TEXT CHECK (ai_result_status IN ('okay', 'not_okay')),
    main_defect TEXT,
    ai_confidence_score FLOAT8,
    validation_status TEXT DEFAULT 'Pending' CHECK (validation_status IN ('Pending', 'Resolved', 'Reworked', 'Scrapped')),
    inspector_id UUID REFERENCES users(id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    defect_type TEXT,
    location TEXT,
    description TEXT,
    confidence_score FLOAT8,
    bounding_box JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function for dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_inspections BIGINT,
    total_anomalies BIGINT,
    accuracy_rate FLOAT8,
    active_operators BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM inspections) as total_inspections,
        (SELECT COUNT(*) FROM anomalies) as total_anomalies,
        94.2::FLOAT8 as accuracy_rate,
        (SELECT COUNT(*) FROM users WHERE status = 'Online') as active_operators;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read on divisions" ON divisions;
CREATE POLICY "Allow authenticated read on divisions" ON divisions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on users" ON users;
CREATE POLICY "Allow authenticated read on users" ON users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on inspections" ON inspections;
CREATE POLICY "Allow authenticated read on inspections" ON inspections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on anomalies" ON anomalies;
CREATE POLICY "Allow authenticated read on anomalies" ON anomalies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow user to update own profile" ON users;
CREATE POLICY "Allow user to update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- SEED DATA
-- Divisions
INSERT INTO divisions (id, name, description, color_code) VALUES
('d1b1b1b1-b1b1-41b1-b1b1-b1b1b1b1b1b1', 'Final Mechanic', 'Inspeksi struktur dan komponen mekanis utama.', '#3b82f6'),
('d2b2b2b2-b2b2-42b2-b2b2-b2b2b2b2b2b2', 'Final Electric', 'Pengecekan sistem kelistrikan dan wiring.', '#10b981'),
('d3b3b3b3-b3b3-43b3-b3b3-b3b3b3b3b3b3', 'Incoming', 'Inspeksi material dan komponen yang baru masuk.', '#f59e0b')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, color_code = EXCLUDED.color_code;

-- Sample Inspections
INSERT INTO inspections (id, part_id, division_id, ai_result_status, main_defect, ai_confidence_score, validation_status) VALUES
('e1e1e1e1-e1e1-41e1-e1e1-e1e1e1e1e1e1', 'BG-2026-0001', 'd1b1b1b1-b1b1-41b1-b1b1-b1b1b1b1b1b1', 'not_okay', 'Cat mengelupas', 92.4, 'Pending'),
('e2e2e2e2-e2e2-42e2-e2e2-e2e2e2e2e2e2', 'BG-2026-0002', 'd1b1b1b1-b1b1-41b1-b1b1-b1b1b1b1b1b1', 'okay', 'None', 98.8, 'Resolved'),
('e3e3e3e3-e3e3-43e3-e3e3-e3e3e3e3e3e3', 'BG-2026-0003', 'd2b2b2b2-b2b2-42b2-b2b2-b2b2b2b2b2b2', 'not_okay', 'Baret Dalam', 88.1, 'Reworked')
ON CONFLICT (id) DO NOTHING;

-- Sample Anomalies
INSERT INTO anomalies (inspection_id, defect_type, location, description, confidence_score, bounding_box) VALUES
('e1e1e1e1-e1e1-41e1-e1e1-e1e1e1e1e1e1', 'Cat mengelupas', 'Bottom Left Frame', 'Significant paint peeling indicating exposure.', 92.4, '{"x": 150, "y": 200, "w": 320, "h": 240}'),
('e3e3e3e3-e3e3-43e3-e3e3-e3e3e3e3e3e3', 'Baret Dalam', 'Side Panel', 'Deep scratch potentially affecting structural integrity.', 88.1, '{"x": 400, "y": 100, "w": 120, "h": 80}')
ON CONFLICT DO NOTHING;

CREATE POLICY "Allow insert inspections"
ON inspections
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow insert anomalies"
ON anomalies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update inspections"
ON inspections
FOR UPDATE
TO authenticated
USING (true);