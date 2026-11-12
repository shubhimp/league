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

-- 11. Seed Initial Flagship Events
INSERT INTO league_events (
    id, slug, title, tagline, description, event_type, status, approval_status, is_featured,
    private_access_code, organizer_id, organizer_name, organizer_org, cover_url,
    start_time, end_time, location, venue_type, discord_channel, max_capacity, tags, prizes, schedule, rounds, important_links, rsvp_count
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
    '#nerdhacks-2026',
    500,
    ARRAY['AI Agents', 'Rust', 'Linux', 'Hardware', 'Open Source'],
    '[{"title": "Grand Grandmaster Hack", "amount": "$5,000", "description": "Best overall technical feat and execution"}, {"title": "Hardware & IoT Runner", "amount": "$3,000", "description": "Physical computing with ESP32 or Raspberry Pi"}]'::jsonb,
    '[{"time": "Day 1 - 09:00 AM", "title": "Check-in & Opening Ceremony", "track": "Main Stage", "speaker": "Core Team"}, {"time": "Day 2 - 06:00 PM", "title": "Live Jury Demos", "track": "Stage", "speaker": "Judges"}]'::jsonb,
    '[{"id": "rnd_1", "roundNumber": 1, "title": "Round 1: Registration & Abstract Pitch", "startDate": "2026-10-15", "endDate": "2026-11-05", "description": "Submit your team members and abstract.", "status": "active", "submissionType": "deck"}, {"id": "rnd_2", "roundNumber": 2, "title": "Round 2: 36-Hour Hackathon & Code Freeze", "startDate": "2026-11-15", "endDate": "2026-11-16", "description": "Live hacking period. Push code to GitHub.", "status": "upcoming", "submissionType": "github"}, {"id": "rnd_3", "roundNumber": 3, "title": "Round 3: Grand Finale & Live Jury Demos", "startDate": "2026-11-16", "endDate": "2026-11-16", "description": "Top 10 shortlisted teams pitch live on stage.", "status": "upcoming", "submissionType": "offline"}]'::jsonb,
    '[{"id": "lnk_1", "title": "Official Discord Channel", "url": "https://discord.gg/nerdsroom", "type": "discord"}, {"id": "lnk_2", "title": "Rulebook & Problem Statements", "url": "https://notion.so/nerdsroom/rulebook", "type": "rulebook"}, {"id": "lnk_3", "title": "WhatsApp Attendees Group", "url": "https://chat.whatsapp.com/nerdsroom", "type": "whatsapp"}]'::jsonb,
    168
),
(
    'evt_hack_02',
    'kernel-and-terminal-sprint',
    'Kernel & Cybernetics Speedrun',
    'Write a tiny OS, custom shell, or bootloader in a weekend.',
    'A deep-dive low-level systems hackathon. Build hyper-minimalist tools, terminal TUIs, RISC-V emulators, and networked daemons on bare metal.',
    'hackathon',
    'upcoming',
    'approved',
    true,
    'public_live',
    'usr_org_01',
    'Aditya Sharma',
    'Nerds Room Core Systems',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    '2026-12-05T10:00:00.000Z',
    '2026-12-06T18:00:00.000Z',
    'Delhi NCR & Live Stream',
    'in-person',
    '#kernel-sprint',
    200,
    ARRAY['C/C++', 'Rust', 'Assembly', 'Linux', 'Retro'],
    '[{"title": "Iron Ring Low-Level Award", "amount": "$2,500", "description": "Most impressive bare-metal achievement"}]'::jsonb,
    '[]'::jsonb,
    '[{"id": "rnd_k1", "roundNumber": 1, "title": "Round 1: Initial Architecture RFC", "startDate": "2026-11-20", "endDate": "2026-12-01", "description": "Submit architectural RFC for your kernel or shell.", "status": "upcoming", "submissionType": "link"}, {"id": "rnd_k2", "roundNumber": 2, "title": "Round 2: Speedrun Hacking & Benchmark", "startDate": "2026-12-05", "endDate": "2026-12-06", "description": "Code submission and automated benchmarks.", "status": "upcoming", "submissionType": "github"}]'::jsonb,
    '[{"id": "lnk_k1", "title": "Discord #kernel-sprint", "url": "https://discord.gg/nerdsroom", "type": "discord"}]'::jsonb,
    84
)
ON CONFLICT (id) DO NOTHING;
