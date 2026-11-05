import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import os from 'os';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'nerds-room-league-secret-key-1337-secure';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Auth Helper
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
};

// -------------------------------------------------------------
// SYSTEM & HEALTH (Server & Cluster Info)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const totalMem = Math.round(os.totalmem() / 1024 / 1024);
  const freeMem = Math.round(os.freemem() / 1024 / 1024);
  const usedMem = totalMem - freeMem;

  res.json({
    status: 'online',
    platform: 'Nerds Room Edge Linux Server',
    hostname: os.hostname(),
    uptimeSeconds: Math.floor(os.uptime()),
    nodeVersion: process.version,
    memory: {
      totalMb: totalMem,
      usedMb: usedMem,
      freeMb: freeMem,
      usagePercent: Math.round((usedMem / totalMem) * 100)
    },
    message: '🚀 Nerds Room League backend is live and operational!'
  });
});

// -------------------------------------------------------------
// AUTH ROUTES (Self-Hosted Event API)
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, githubHandle, discordTag } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    const existing = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'usr_' + randomBytes(6).toString('hex'),
      email: email.toLowerCase(),
      passwordHash,
      username,
      githubHandle: githubHandle || username,
      discordTag: discordTag || '',
      role: 'hacker',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      createdAt: new Date().toISOString()
    };

    db.insert('users', newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { passwordHash: _, ...userWithoutPass } = newUser;
    res.status(201).json({ user: userWithoutPass, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { passwordHash: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.find('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...userWithoutPass } = user;
  res.json({ user: userWithoutPass });
});

// -------------------------------------------------------------
// EVENT ROUTES
// -------------------------------------------------------------
app.get('/api/events', (req, res) => {
  const { type, status } = req.query;
  let events = db.getTable('events');

  if (type && type !== 'all') {
    events = events.filter(e => e.eventType === type);
  }
  if (status && status !== 'all') {
    events = events.filter(e => e.status === status);
  }

  // Calculate live counts
  const enriched = events.map(e => {
    const rsvpCount = db.filter('rsvps', r => r.eventId === e.id).length;
    return { ...e, rsvpCount };
  });

  res.json({ events: enriched });
});

app.get('/api/events/:slug', (req, res) => {
  const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const rsvps = db.filter('rsvps', r => r.eventId === event.id);
  const teams = db.filter('teams', r => r.eventId === event.id);
  const projects = db.filter('projects', r => r.eventId === event.id);

  res.json({
    event: {
      ...event,
      rsvpCount: rsvps.length,
      teams,
      projects
    }
  });
});

app.post('/api/events', authenticate, (req, res) => {
  try {
    const { title, tagline, description, eventType, coverUrl, startTime, endTime, location, venueType, tags, prizes, schedule } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newEvent = {
      id: 'evt_' + randomBytes(5).toString('hex'),
      slug,
      title,
      tagline: tagline || '',
      description: description || '',
      eventType: eventType || 'hackathon',
      status: 'active',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 86400000).toISOString(),
      location: location || 'Nerds Room HQ & Virtual',
      venueType: venueType || 'hybrid',
      discordChannel: '#hack-stage',
      maxCapacity: 300,
      tags: tags || ['Hacking', 'NerdsRoom'],
      prizes: prizes || [],
      schedule: schedule || [],
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };

    db.insert('events', newEvent);
    res.status(201).json({ event: newEvent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event: ' + err.message });
  }
});

// Update Event Details (Organizer / Master Admin)
app.put('/api/events/:id', (req, res) => {
  const event = db.find('events', e => e.id === req.params.id || e.slug === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const updated = db.update('events', e => e.id === event.id, req.body);
  res.json({ event: updated });
});

// Master Admin: Update Approval Status ('approved' | 'private' | 'rejected')
app.patch('/api/events/:id/approval', (req, res) => {
  const { status } = req.body;
  if (!['approved', 'private', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid approval status. Must be approved, private, or rejected.' });
  }

  const event = db.find('events', e => e.id === req.params.id || e.slug === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const updated = db.update('events', e => e.id === event.id, { approvalStatus: status });
  res.json({ success: true, event: updated });
});

// Master Admin: Toggle Featured on Site
app.patch('/api/events/:id/featured', (req, res) => {
  const { isFeatured } = req.body;
  const event = db.find('events', e => e.id === req.params.id || e.slug === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const updated = db.update('events', e => e.id === event.id, { isFeatured: Boolean(isFeatured) });
  res.json({ success: true, event: updated });
});

// Master Admin: Get All Attendees across all events
app.get('/api/attendees', (req, res) => {
  const rsvps = db.getTable('rsvps');
  const events = db.getTable('events');

  const enriched = rsvps.map(rsvp => {
    const event = events.find(e => e.id === rsvp.eventId);
    return {
      rsvp,
      event: event ? { id: event.id, title: event.title, location: event.location, startTime: event.startTime } : null
    };
  });

  res.json({ attendees: enriched });
});

// Master Admin: Toggle Attendee Check-In Override
app.post('/api/attendees/:id/toggle-checkin', (req, res) => {
  const rsvp = db.find('rsvps', r => r.id === req.params.id);
  if (!rsvp) return res.status(404).json({ error: 'RSVP not found' });

  const newCheckedIn = !rsvp.checkedIn;
  const updated = db.update('rsvps', r => r.id === rsvp.id, {
    checkedIn: newCheckedIn,
    checkedInAt: newCheckedIn ? new Date().toISOString() : null
  });

  res.json({ success: true, rsvp: updated });
});

// -------------------------------------------------------------
// RSVP & DIGITAL HACKER PASS
// -------------------------------------------------------------
app.post('/api/events/:slug/rsvp', (req, res) => {
  try {
    const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { hackerName, email, githubHandle, discordTag, hackerRole, teamName, dietaryNeeds } = req.body;
    if (!hackerName || !email) {
      return res.status(400).json({ error: 'Hacker name and email are required' });
    }

    // Check if already registered
    const existing = db.find('rsvps', r => r.eventId === event.id && r.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.json({ rsvp: existing, alreadyRegistered: true });
    }

    // Generate unique short verifiable pass code
    const passCode = `HACK-PASS-${randomBytes(3).toString('hex').toUpperCase()}`;

    const newRsvp = {
      id: 'rsvp_' + randomBytes(6).toString('hex'),
      eventId: event.id,
      hackerName,
      email: email.toLowerCase(),
      githubHandle: githubHandle || '',
      discordTag: discordTag || '',
      hackerRole: hackerRole || 'Fullstack Builder',
      teamName: teamName || 'Solo Hacker',
      dietaryNeeds: dietaryNeeds || 'Standard',
      passCode,
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date().toISOString()
    };

    db.insert('rsvps', newRsvp);
    res.status(201).json({ rsvp: newRsvp, eventTitle: event.title });
  } catch (err) {
    res.status(500).json({ error: 'RSVP failed: ' + err.message });
  }
});

// Verify Ticket Pass (For Organizer Scanner & Badge Lookup)
app.get('/api/passes/verify/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const rsvp = db.find('rsvps', r => r.passCode.toUpperCase() === code);
  if (!rsvp) {
    return res.status(404).json({ valid: false, message: 'Invalid or unknown ticket code.' });
  }

  const event = db.find('events', e => e.id === rsvp.eventId);
  res.json({
    valid: true,
    rsvp,
    event: event ? { title: event.title, location: event.location, startTime: event.startTime } : null
  });
});

// Check-in Attendee via Pass Code (Organizer check-in)
app.post('/api/passes/checkin', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Pass code is required' });

  const rsvp = db.find('rsvps', r => r.passCode.toUpperCase() === code.trim().toUpperCase());
  if (!rsvp) return res.status(404).json({ error: 'Ticket not found' });

  if (rsvp.checkedIn) {
    return res.json({ success: true, alreadyCheckedIn: true, rsvp, message: 'Attendee was already checked in!' });
  }

  const updated = db.update(
    'rsvps',
    r => r.id === rsvp.id,
    { checkedIn: true, checkedInAt: new Date().toISOString() }
  );

  res.json({ success: true, alreadyCheckedIn: false, rsvp: updated, message: 'Check-in successful! Welcome hacker!' });
});

// -------------------------------------------------------------
// TEAMS & "LOOKING FOR TEAM"
// -------------------------------------------------------------
app.get('/api/events/:slug/teams', (req, res) => {
  const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const teams = db.filter('teams', t => t.eventId === event.id);
  res.json({ teams });
});

app.post('/api/events/:slug/teams', (req, res) => {
  const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { teamName, pitch, lookingForRoles, contactLink, maxMembers } = req.body;
  if (!teamName || !pitch) return res.status(400).json({ error: 'Team name and pitch are required' });

  const newTeam = {
    id: 'team_' + randomBytes(5).toString('hex'),
    eventId: event.id,
    teamName,
    pitch,
    lookingForRoles: Array.isArray(lookingForRoles) ? lookingForRoles : [lookingForRoles],
    contactLink: contactLink || 'https://discord.gg/nerdsroom',
    membersCount: 1,
    maxMembers: Number(maxMembers) || 4,
    createdAt: new Date().toISOString()
  };

  db.insert('teams', newTeam);
  res.status(201).json({ team: newTeam });
});

// -------------------------------------------------------------
// PROJECT SHIPYARD & UPVOTES
// -------------------------------------------------------------
app.get('/api/events/:slug/projects', (req, res) => {
  const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const projects = db.filter('projects', p => p.eventId === event.id)
    .sort((a, b) => b.upvotes - a.upvotes);
  res.json({ projects });
});

app.post('/api/events/:slug/projects', (req, res) => {
  const event = db.find('events', e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { title, tagline, repoUrl, demoUrl, coverImage, teamMembers, tags } = req.body;
  if (!title || !repoUrl) return res.status(400).json({ error: 'Project title and repo URL are required' });

  const newProject = {
    id: 'proj_' + randomBytes(6).toString('hex'),
    eventId: event.id,
    title,
    tagline: tagline || 'Shipped at ' + event.title,
    repoUrl,
    demoUrl: demoUrl || '',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    teamMembers: Array.isArray(teamMembers) ? teamMembers : [teamMembers || 'Anonymous Hacker'],
    tags: Array.isArray(tags) ? tags : ['Hackathon'],
    upvotes: 1,
    createdAt: new Date().toISOString()
  };

  db.insert('projects', newProject);
  res.status(201).json({ project: newProject });
});

app.post('/api/projects/:id/upvote', (req, res) => {
  const project = db.find('projects', p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const updated = db.update('projects', p => p.id === project.id, {
    upvotes: (project.upvotes || 0) + 1
  });

  res.json({ success: true, upvotes: updated.upvotes });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`⚡ NERDS ROOM LEAGUE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`📍 Environment: Linux / Node.js Production Server`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
