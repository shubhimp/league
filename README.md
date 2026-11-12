# ⚡ Nerds Room League (`league.nerdsroom.org`)

> **The Premier Multi-Round Event & Hackathon Hosting Platform for Nerds Room**

Built strictly in the exact light-theme visual design system of the main Nerds Room website (`#00308F` Royal Blue, `#9BE600` Lime, `#001a4d` Deep Navy, floating pill glassmorphism navbar, and signature brutalist drop shadows).

---

## 🌟 Core Features & Architecture

### 1. 👑 Master Admin Dashboard (`/admin-panel`)
- **3-Tier Event Visibility Controls:**
  - **`Approved` (Live on Site):** Publicly published to the homepage directory, search, and category filters.
  - **`Private` (Link Only):** Unlisted from public search; accessible exclusively via a private link (`?event=slug&secret=access_code`).
  - **`Rejected` (Hidden):** Filtered out with admin rejection tag.
- **`Feature on Site` Spotlight Toggle:**
  - One-click star toggle to highlight premier flagship hackathons in the radiant hero section and attach a `⭐ FEATURED` badge to their event card.
- **Platform KPI Metrics:** Real-time counters for Total Events, Approved, Private, Rejected, and Featured.
- **Community Role Manager:** Manage and promote community members across Student, Organizer, and Master Admin roles.

### 2. 🛠️ Organizer Command Center (`/organizer-portal`)
- **Hosted Events Roster:** Track review status (`Approved`, `Private`, `Rejected`) and active registrations.
- **Secret Invite Generator:** Instant one-click copyable secret links for private events.
- **Attendee List & Check-in Desk:**
  - Live table of registered attendees, contacts, tracks, and check-in statuses.
  - **One-Click CSV Export:** Export attendee lists for offline operations.
  - **Entrance Scanner Desk:** Real-time QR and ticket passcode validation scanner.
- **Multi-Round Builder:** Create custom rounds (Title, dates, deliverable format: Pitch Deck, GitHub repo, Link, or Offline).
- **Important Links Builder:** Add Discord, WhatsApp, Rulebook Notion, and GitHub starter links.

### 3. 🎓 Student & Attendee Dashboard (`/student-dashboard`)
- **Personalized Student Workspace:** Welcome banner with active registrations counter and formed squads.
- **Rounds Progression Tracker:** Visual countdowns for active round deadlines and submission requirements.
- **Digital Verifiable QR Tickets:** High-contrast digital ticket pass with scannable QR badge for on-site or virtual check-in.

### 4. ⚡ 1-Click Role Switcher in Floating Pill Navbar
- Seamlessly toggle between:
  - 🎓 **Student Hacker (`Rohan Verma`)**
  - 🛠️ **Organizer Mode (`Aditya Sharma`)**
  - 👑 **Master Admin (`Core Admin`)**

### 5. 🚀 Additional Features
- **Team Matchmaking Board:** Find teammates skilled in AI, Rust, Hardware, and UI.
- **Project Shipyard:** Hack submission showcase with peer upvoting, repo links, and demo previews.
- **Serverless Cloud Engine:** Powered by Supabase PostgreSQL & Auth, Cloudinary Media CDN, and Vercel Edge Functions (`api/*`) with automatic local cache resilience.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite dev server (runs on port 3030)
npm run dev

# 3. Production build verification
npm run build
```

---

## 📁 Project Structure

```
league-platform/
├── src/
│   ├── components/
│   │   ├── HackNavbar.tsx             # Floating pill navbar with 1-click role switcher
│   │   ├── TerminalHero.tsx           # Hero section with countdown and featured spotlight
│   │   ├── EventCard.tsx              # Event cards with featured/private status badges
│   │   ├── HackEventDetails.tsx       # Event details, rounds schedule, and important links
│   │   ├── UserDashboard.tsx          # Unified student tickets & organizer hosting hub
│   │   ├── MasterAdminDashboard.tsx   # Master admin moderation panel with status dropdowns
│   │   ├── HackerRSVPModal.tsx        # Registration modal
│   │   ├── HackerPassModal.tsx        # Verifiable QR ticket pass
│   │   ├── CreateEventModal.tsx       # Event & dynamic rounds builder
│   │   ├── TeamBoardModal.tsx         # Teammate matchmaking board
│   │   ├── ProjectShipyardModal.tsx   # Hack project demo submissions
│   │   ├── OrganizerCheckInModal.tsx  # Entrance ticket scanner check-in desk
│   │   ├── AuthModal.tsx              # Self-made Auth + Google OAuth modal
│   │   ├── SocialShareModal.tsx       # Lu.ma-style OG preview cards & direct social share
│   │   └── CloudStatusModal.tsx       # Supabase + Cloudinary + Vercel diagnostics
│   ├── services/
│   │   └── hackApi.ts                 # Supabase DB + Auth + Cloudinary + Vercel API service
│   ├── types.ts                       # TypeScript interfaces
│   ├── HackHubPage.tsx                # Main application page router
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/                               # Vercel Serverless Functions (OG, Admin Gate, Cloudinary Sign)
│   ├── admin-verify.ts                # Server-side Master Admin verification
│   ├── cloudinary-sign.ts             # Signed Cloudinary cover uploads
│   ├── health.ts                      # Edge + DB connectivity check
│   └── share.ts                       # Dynamic Lu.ma-style OpenGraph proxy
├── supabase_league_schema.sql         # PostgreSQL schema & RLS policies
├── vercel.json                        # Vercel bot OG rewrites & SPA routing
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🌐 Deploying to `league.nerdsroom.org`

1. Push `league-platform` to GitHub (`shubhimp/league`).
2. Import into Vercel (`https://vercel.com`) with Framework Preset **Vite**.
3. Configure Environment Variables in Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MASTER_ADMIN_ID`, `MASTER_ADMIN_PASS`).
4. Point DNS `CNAME league -> cname.vercel-dns.com` to serve `https://league.nerdsroom.org`.
