-- ==============================================================================
-- NERDS ROOM LEAGUE PLATFORM — SUPABASE POSTGRESQL SCHEMA
-- Connects with Shubhi's Supabase instance: https://agnscincokkwkhgdwoab.supabase.co
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/agnscincokkwkhgdwoab/sql
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. League Events Table (Multi-round, Approval States, Organizer Details)
CREATE TABLE IF NOT EXISTS league_events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    event_type TEXT DEFAULT 'hackathon',
    status TEXT DEFAULT 'active',
    approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('approved', 'private', 'rejected')),
    is_featured BOOLEAN DEFAULT false,
    private_access_code TEXT,
    organizer_id TEXT,
    organizer_name TEXT NOT NULL DEFAULT 'Nerds Room Community',
    organizer_org TEXT DEFAULT 'Nerds Room Lead',
    organizer_contact TEXT,
    cover_url TEXT DEFAULT 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 days'),
    location TEXT DEFAULT 'Bengaluru / Hybrid & Global Virtual',
    venue_type TEXT DEFAULT 'hybrid',
    discord_channel TEXT DEFAULT '#general',
    max_capacity INT DEFAULT 500,
    tags TEXT[] DEFAULT ARRAY['Hacking', 'NerdsRoom'],
    prizes JSONB DEFAULT '[]'::jsonb,
    schedule JSONB DEFAULT '[]'::jsonb,
    rounds JSONB DEFAULT '[]'::jsonb,
    important_links JSONB DEFAULT '[]'::jsonb,
    rsvp_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. League RSVPs & Digital Hacker Pass
CREATE TABLE IF NOT EXISTS league_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES league_events(id) ON DELETE CASCADE,
    hacker_name TEXT NOT NULL,
    email TEXT NOT NULL,
    github_handle TEXT,
    discord_tag TEXT,
    hacker_role TEXT DEFAULT 'Fullstack Builder',
    team_name TEXT DEFAULT 'Solo Hacker',
    dietary_needs TEXT DEFAULT 'Standard',
    pass_code TEXT UNIQUE NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. League Matchmaking Teams
CREATE TABLE IF NOT EXISTS league_teams (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES league_events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    pitch TEXT NOT NULL,
    looking_for_roles TEXT[] DEFAULT ARRAY['Hacker'],
    contact_link TEXT DEFAULT 'https://discord.gg/nerdsroom',
    members_count INT DEFAULT 1,
    max_members INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. League Project Shipyard & Upvoting
CREATE TABLE IF NOT EXISTS league_projects (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES league_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tagline TEXT,
    repo_url TEXT NOT NULL,
    demo_url TEXT,
    cover_image TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    team_members TEXT[] DEFAULT ARRAY['Anonymous Builder'],
    tags TEXT[] DEFAULT ARRAY['Hackathon'],
    upvotes INT DEFAULT 1,
    submitted_by_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_projects ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Public Read/Write for Platform Features)
CREATE POLICY "Allow public read access to events" 
ON league_events FOR SELECT USING (true);

CREATE POLICY "Allow insert/update to events" 
ON league_events FOR ALL USING (true);

CREATE POLICY "Allow public read and insert to rsvps" 
ON league_rsvps FOR ALL USING (true);

CREATE POLICY "Allow public read and insert to teams" 
ON league_teams FOR ALL USING (true);

CREATE POLICY "Allow public read and insert to projects" 
ON league_projects FOR ALL USING (true);

-- 8. Seed Default Flagship Events
INSERT INTO league_events (
    id, slug, title, tagline, description, event_type, status, approval_status, is_featured,
    private_access_code, organizer_id, organizer_name, organizer_org, cover_url,
    start_time, end_time, location, venue_type, tags, prizes, rounds, important_links, rsvp_count
) VALUES 
(
    'evt_hack_01',
    'nerdhacks-2026',
    'NerdHacks 2026: AI & Systems Jam',
    '36 Hours of shipping compilers, local LLM agents, and hardware cybernetics.',
    'The flagship hackathon of Nerds Room. 36 hours of relentless building, open-source hacking, free fuel, and $15,000+ in bounties. Bring your solder irons, your laptops, and your bold ideas.',
    'hackathon',
    'active',
    'approved',
    true,
    'public_live',
    'usr_org_01',
    'Aditya Sharma',
    'Nerds Room Lead Organizer',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    '2026-11-15T09:00:00.000Z',
    '2026-11-16T21:00:00.000Z',
    'Bengaluru / Hybrid & Global Virtual',
    'hybrid',
    ARRAY['AI Agents', 'Rust', 'Linux', 'Hardware', 'Open Source'],
    '[{"title": "Grand Grandmaster Hack", "amount": "$5,000", "description": "Best overall technical feat and execution"}, {"title": "Hardware & IoT Runner", "amount": "$3,000", "description": "Physical computing with ESP32 or Raspberry Pi"}]'::jsonb,
    '[{"id": "rnd_1", "roundNumber": 1, "title": "Round 1: Registration & Abstract Pitch", "startDate": "2026-10-15", "endDate": "2026-11-05", "description": "Submit your team members and abstract.", "status": "active", "submissionType": "deck"}, {"id": "rnd_2", "roundNumber": 2, "title": "Round 2: 36-Hour Hackathon & Code Freeze", "startDate": "2026-11-15", "endDate": "2026-11-16", "description": "Live hacking period. Push code to GitHub.", "status": "upcoming", "submissionType": "github"}]'::jsonb,
    '[{"id": "lnk_1", "title": "Official Discord Channel", "url": "https://discord.gg/nerdsroom", "type": "discord"}, {"id": "lnk_2", "title": "Rulebook & Problem Statements", "url": "https://notion.so/nerdsroom/rulebook", "type": "rulebook"}]'::jsonb,
    168
)
ON CONFLICT (id) DO NOTHING;
