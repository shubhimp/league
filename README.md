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
- **Embedded Sandbox Engine:** Runs with 100% functionality out of the box in offline/local storage mode, with instant option to connect a self-hosted backend.

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
│   │   ├── StudentDashboard.tsx       # Student dashboard with round deadlines and ticket passes
│   │   ├── OrganizerDashboard.tsx     # Organizer portal with attendee roster and CSV export
│   │   ├── MasterAdminDashboard.tsx   # Master admin moderation panel with status dropdowns
│   │   ├── HackerRSVPModal.tsx        # Registration modal
│   │   ├── HackerPassModal.tsx        # Verifiable QR ticket pass
│   │   ├── CreateEventModal.tsx       # Event & dynamic rounds builder
│   │   ├── TeamBoardModal.tsx         # Teammate matchmaking board
│   │   ├── ProjectShipyardModal.tsx   # Hack project demo submissions
│   │   ├── OrganizerCheckInModal.tsx  # Entrance ticket scanner check-in desk
│   │   ├── AuthModal.tsx              # Sign In / Sign Up modal with role selection
│   │   └── NestSettingsModal.tsx      # Cloud API endpoint configuration
│   ├── services/
│   │   └── hackApi.ts                 # Central data service with strict approval filtering
│   ├── types.ts                       # TypeScript interfaces
│   ├── HackHubPage.tsx                # Main application page router
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/                            # Optional standalone persistent backend (Node/Express)
│   ├── src/
│   │   ├── index.js                   # REST API
│   │   └── db.js                      # Embedded JSON database
│   ├── deploy.sh                      # 1-click Linux deployment script
│   ├── ecosystem.config.cjs           # PM2 daemon configuration
│   ├── Caddyfile                      # Caddy reverse proxy for SSL
│   └── package.json
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🌐 Deploying to `league.nerdsroom.org`

### Option A: Vercel / Cloudflare Pages / Netlify (Recommended for Frontend)
1. Push this folder to a new repository on GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for league.nerdsroom.org"
   git remote add origin https://github.com/YOUR_ORG/league.nerdsroom.org.git
   git branch -M main
   git push -u origin main
   ```
2. Import the repository into Vercel / Cloudflare Pages.
3. Configure your custom domain to point `league.nerdsroom.org` to the deployment.

### Option B: Self-Hosted Server
If deploying the backend server:
```bash
cd server
npm install
npm start
```
Or run `bash deploy.sh` with PM2.
