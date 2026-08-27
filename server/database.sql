-- 1. Devices Table
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    form_factor VARCHAR(50)
);

-- 2. EQ Profiles Table
-- Uses JSONB for the bands, which is a Postgres superpower for fast JSON querying
CREATE TABLE eq_profiles (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    submitter_name VARCHAR(100),
    title VARCHAR(150) NOT NULL,
    preamp_gain NUMERIC NOT NULL,
    bands JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Votes Table (Anonymous Client Tracking)
-- Dedup is keyed on client_id (a UUID generated client-side and stored in
-- localStorage — see client/src/utils/clientId.js), not IP address. IP-based
-- dedup broke down behind shared/NAT'd IPs (offices, campuses, carrier-grade
-- NAT) where many real people share one address, and swapped networks let
-- one person vote repeatedly. ip_address is kept as a non-unique audit column
-- only, for abuse investigation — it no longer drives the constraint.
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    eq_profile_id INTEGER REFERENCES eq_profiles(id) ON DELETE CASCADE,
    vote_value INTEGER NOT NULL CHECK (vote_value IN (1, -1)),
    UNIQUE(client_id, eq_profile_id)
);

-- Insert some dummy hardware so your dropdown has data to load!
INSERT INTO devices (brand, model, form_factor) VALUES 
('Sennheiser', 'HD600', 'Over-ear'),
('Hifiman', 'Sundara', 'Over-ear'),
('Moondrop', 'Aria', 'In-ear (IEM)');