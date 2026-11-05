# ⚡ Nerds Room League Backend Server

Lightweight, robust, and zero-maintenance event platform API server with embedded persistent JSON database, JWT authentication, and QR pass verification.

## 🚀 Quick Deployment (3 Steps)

### Step 1: Clone or Copy this Server Folder to your Server / VPS
```bash
git clone <your-repo-url>
cd server
```

### Step 2: Install & Start
```bash
npm install
npm start
```
Or use the automated deploy script:
```bash
bash deploy.sh
```

This script will:
- Check and install Node.js (v20 LTS).
- Install `pm2` process manager.
- Install backend dependencies.
- Launch the API as a background daemon with auto-restart on port `8080`.

---

## 🔒 Free HTTPS Reverse Proxy with Caddy

To serve with automatic SSL certificate management on your custom domain:
```bash
caddy reverse-proxy --from api.league.nerdsroom.org --to :8080
```
Or use the included `Caddyfile`.

---

## 🛠️ API Endpoints Summary

- `GET /api/health` - Live memory, uptime, and cluster status.
- `POST /api/auth/register` - User signup with bcrypt + JWT.
- `POST /api/auth/login` - User login with JWT.
- `GET /api/auth/me` - Authenticated user profile.
- `GET /api/events` - All hackathons, workshops, and meetups.
- `GET /api/events/:slug` - Detailed event page with rounds, schedule, teams, and projects.
- `POST /api/events/:slug/rsvp` - Hacker registration + generates verifiable `NR-XXXXX` ticket pass.
- `GET /api/passes/verify/:code` - Verify ticket QR code.
- `POST /api/passes/checkin` - Organizer scanner check-in desk.
- `GET /api/events/:slug/teams` - "Looking for Team" matchmaking board.
- `POST /api/events/:slug/teams` - Post team or hacker listing.
- `GET /api/events/:slug/projects` - Hack project submissions (Shipyard).
- `POST /api/events/:slug/projects` - Submit hack project with repo and demo URL.
- `POST /api/projects/:id/upvote` - Upvote hack project.
