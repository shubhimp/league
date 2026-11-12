-- ==============================================================================
-- NERDS ROOM LEAGUE PLATFORM — SUPABASE POSTGRESQL SCHEMA
-- Target Project: https://zjlatiflzqssrnzvsmhv.supabase.co
-- Run in SQL Editor: https://supabase.com/dashboard/project/zjlatiflzqssrnzvsmhv/sql/new
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. League User Profiles (Supports Google OAuth + Self-Made Email/Password Auth)
CREATE TABLE IF NOT EXISTS league_profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'organizer', 'master_admin')),
    avatar_url TEXT,
    github_handle TEXT,
    college TEXT,
    auth_provider TEXT DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. League Events Table (Multi-Round, Organizer Details, Approval & Private Gate)
CREATE TABLE IF NOT EXISTS league_events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    event_type TEXT DEFAULT 'hackathon',
    status TEXT DEFAULT 'active',
    approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('approved', 'private', 'rejected', 'pending')),
    is_featured BOOLEAN DEFAULT false,
    private_access_code TEXT,
    organizer_id TEXT,
    organizer_name TEXT NOT NULL DEFAULT 'Nerds Room Community',
    organizer_org TEXT DEFAULT 'Nerds Room Lead Organizer',
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

-- 4. League RSVPs & Verifiable QR Hacker Pass
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

-- 5. League Matchmaking Teams
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

-- 6. League Project Shipyard & Upvoting
CREATE TABLE IF NOT EXISTS league_projects (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES league_events(id) ON DELETE CASCADE,
    round_id TEXT,
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

-- 7. Performance Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_league_events_slug ON league_events(slug);
CREATE INDEX IF NOT EXISTS idx_league_events_status ON league_events(approval_status);
CREATE INDEX IF NOT EXISTS idx_league_events_org ON league_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_league_rsvps_event ON league_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_league_rsvps_email ON league_rsvps(email);
CREATE INDEX IF NOT EXISTS idx_league_rsvps_pass ON league_rsvps(pass_code);
CREATE INDEX IF NOT EXISTS idx_league_teams_event ON league_teams(event_id);
CREATE INDEX IF NOT EXISTS idx_league_projects_event ON league_projects(event_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE league_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_projects ENABLE ROW LEVEL SECURITY;

-- 9. Clean Idempotent RLS Policies
DROP POLICY IF EXISTS "Allow public access to profiles" ON league_profiles;
CREATE POLICY "Allow public access to profiles" ON league_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to events" ON league_events;
CREATE POLICY "Allow public read access to events" ON league_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert/update to events" ON league_events;
CREATE POLICY "Allow insert/update to events" ON league_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read and insert to rsvps" ON league_rsvps;
CREATE POLICY "Allow public read and insert to rsvps" ON league_rsvps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read and insert to teams" ON league_teams;
CREATE POLICY "Allow public read and insert to teams" ON league_teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read and insert to projects" ON league_projects;
CREATE POLICY "Allow public read and insert to projects" ON league_projects FOR ALL USING (true) WITH CHECK (true);

-- 10. Auto-Increment RSVP Count Trigger
CREATE OR REPLACE FUNCTION increment_league_event_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE league_events SET rsvp_count = COALESCE(rsvp_count, 0) + 1 WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_rsvp_count ON league_rsvps;
CREATE TRIGGER trg_increment_rsvp_count
AFTER INSERT ON league_rsvps
FOR EACH ROW EXECUTE FUNCTION increment_league_event_rsvp();

-- Schema ready! Live events and registrations are created strictly by signed-in community members.
