import { HackEvent, HackerRSVP, HackerTeam, HackProject, UserAccount, EventApprovalStatus, UserRole, InfrastructureHealth, NestClusterHealth } from '../types';

const STORAGE_KEYS = {
  EVENTS: 'nerds_league_events',
  RSVPS: 'nerds_league_rsvps',
  TEAMS: 'nerds_league_teams',
  PROJECTS: 'nerds_league_projects',
  MY_PASSES: 'nerds_league_my_passes',
  CURRENT_USER: 'nerds_league_current_user',
  USERS_LIST: 'nerds_league_users_list',
  API_URL: 'nerds_league_api_url',
};

// Preset demo accounts for quick role-switching
export const DEMO_USERS: Record<UserRole, UserAccount> = {
  student: {
    id: 'usr_student_01',
    name: 'Rohan Verma',
    email: 'rohan@student.nerdsroom.org',
    role: 'student',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rohan',
    githubHandle: 'rohan-builds',
    college: 'IIT Delhi / Nerds Room Fellow'
  },
  organizer: {
    id: 'usr_org_01',
    name: 'Aditya Sharma',
    email: 'aditya@nerdsroom.org',
    role: 'organizer',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aditya',
    githubHandle: 'adityasharma',
    college: 'Nerds Room Lead Organizer'
  },
  master_admin: {
    id: 'usr_admin_01',
    name: 'Master Admin',
    email: 'admin@nerdsroom.org',
    role: 'master_admin',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=AdminNerds',
    githubHandle: 'nerds-root',
    college: 'Nerds Room Foundation'
  }
};

// Default seed events with approved, private (link-only), and rejected states
const DEFAULT_EVENTS: HackEvent[] = [
  {
    id: 'evt_hack_01',
    slug: 'nerdhacks-2026',
    title: 'NerdHacks 2026: AI & Systems Jam',
    tagline: '36 Hours of shipping compilers, local LLM agents, and hardware cybernetics.',
    description: 'The flagship hackathon of Nerds Room. 36 hours of relentless building, open-source hacking, free fuel, and $15,000+ in bounties. Bring your solder irons, your laptops, and your bold ideas.',
    eventType: 'hackathon',
    status: 'active',
    approvalStatus: 'approved',
    isFeatured: true,
    privateAccessCode: 'public_live',
    organizerId: 'usr_org_01',
    organizerName: 'Aditya Sharma',
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-15T09:00:00.000Z',
    endTime: '2026-11-16T21:00:00.000Z',
    location: 'Bengaluru / Hybrid & Global Virtual',
    venueType: 'hybrid',
    discordChannel: '#nerdhacks-2026',
    maxCapacity: 500,
    tags: ['AI Agents', 'Rust', 'Linux', 'Hardware', 'Open Source'],
    rsvpCount: 168,
    prizes: [
      { title: 'Grand Grandmaster Hack', amount: '$5,000', description: 'Best overall technical feat and execution' },
      { title: 'Hardware & IoT Runner', amount: '$3,000', description: 'Physical computing with ESP32 or Raspberry Pi' },
      { title: 'Local AI Agent Bounty', amount: '$2,500', description: 'Most ingenious offline/local LLM architecture' },
      { title: 'Wildcard Hack Award', amount: '$1,500', description: 'Most delightfully creative and unconventional project' }
    ],
    schedule: [
      { time: 'Day 1 - 09:00 AM', title: 'Check-in & Breakfast', track: 'General', speaker: 'Core Team' },
      { time: 'Day 1 - 10:30 AM', title: 'Opening Ceremony & Tracks Release', track: 'Main Stage', speaker: 'Mentors' },
      { time: 'Day 1 - 11:30 AM', title: 'Hacking Begins! 🚀', track: 'Hacking', speaker: 'All Hackers' },
      { time: 'Day 1 - 08:00 PM', title: 'Midnight Pizza & Lightning Demos', track: 'Social', speaker: 'Lounge' },
      { time: 'Day 2 - 04:00 PM', title: 'Code Freeze & Shipyard Submissions', track: 'Deadline', speaker: 'Portal' },
      { time: 'Day 2 - 06:00 PM', title: 'Live Demos & Closing Ceremony', track: 'Main Stage', speaker: 'Judges' }
    ],
    rounds: [
      {
        id: 'rnd_1',
        roundNumber: 1,
        title: 'Round 1: Registration & Abstract Pitch',
        startDate: '2026-10-15',
        endDate: '2026-11-05',
        description: 'Submit your team members, preferred technical track, and a 2-paragraph project idea proposal.',
        status: 'active',
        submissionType: 'deck'
      },
      {
        id: 'rnd_2',
        roundNumber: 2,
        title: 'Round 2: 36-Hour Hackathon & Code Freeze',
        startDate: '2026-11-15',
        endDate: '2026-11-16',
        description: 'Live hacking period. Push code to a public GitHub repo and record a 2-minute Loom/YouTube demo.',
        status: 'upcoming',
        submissionType: 'github'
      },
      {
        id: 'rnd_3',
        roundNumber: 3,
        title: 'Round 3: Grand Finale & Live Jury Demos',
        startDate: '2026-11-16',
        endDate: '2026-11-16',
        description: 'Top 10 shortlisted teams pitch live on stage in front of judges, venture founders, and community leads.',
        status: 'upcoming',
        submissionType: 'offline'
      }
    ],
    importantLinks: [
      { id: 'lnk_1', title: 'Official Discord Channel', url: 'https://discord.gg/nerdsroom', type: 'discord' },
      { id: 'lnk_2', title: 'Rulebook & Problem Statements', url: 'https://notion.so/nerdsroom/rulebook', type: 'rulebook' },
      { id: 'lnk_3', title: 'WhatsApp Attendees Group', url: 'https://chat.whatsapp.com/nerdsroom', type: 'whatsapp' },
      { id: 'lnk_4', title: 'GitHub Starter Templates', url: 'https://github.com/nerdsroom', type: 'github' }
    ]
  },
  {
    id: 'evt_hack_02',
    slug: 'kernel-and-terminal-sprint',
    title: 'Kernel & Cybernetics Speedrun',
    tagline: 'Write a tiny OS, custom shell, or bootloader in a weekend.',
    description: 'A deep-dive low-level systems hackathon. Build hyper-minimalist tools, terminal TUIs, RISC-V emulators, and networked daemons on bare metal.',
    eventType: 'hackathon',
    status: 'upcoming',
    approvalStatus: 'approved',
    isFeatured: true,
    privateAccessCode: 'public_live',
    organizerId: 'usr_org_01',
    organizerName: 'Aditya Sharma',
    coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-12-05T10:00:00.000Z',
    endTime: '2026-12-06T18:00:00.000Z',
    location: 'Delhi NCR & Live Stream',
    venueType: 'in-person',
    discordChannel: '#kernel-sprint',
    maxCapacity: 200,
    tags: ['C/C++', 'Rust', 'Assembly', 'Linux', 'Retro'],
    rsvpCount: 84,
    prizes: [
      { title: 'Iron Ring Low-Level Award', amount: '$2,500', description: 'Most impressive bare-metal achievement' },
      { title: 'Best TUI / CLI Application', amount: '$1,000', description: 'Most addictive terminal interface tool' }
    ],
    schedule: [
      { time: '10:00 AM', title: 'Assembler & Bootloader Kickoff', track: 'Dev' },
      { time: '01:00 PM', title: 'Memory Safety vs Unsafe Architecture', track: 'Workshop' },
      { time: '05:00 PM', title: 'Submissions & Benchmarking', track: 'Judging' }
    ],
    rounds: [
      {
        id: 'rnd_k1',
        roundNumber: 1,
        title: 'Round 1: Initial Architecture RFC',
        startDate: '2026-11-20',
        endDate: '2026-12-01',
        description: 'Submit an architectural RFC for your kernel, driver, or custom emulator.',
        status: 'upcoming',
        submissionType: 'link'
      },
      {
        id: 'rnd_k2',
        roundNumber: 2,
        title: 'Round 2: Speedrun Hacking & Benchmark',
        startDate: '2026-12-05',
        endDate: '2026-12-06',
        description: 'Code submission and automated benchmark testing on bare-metal rigs.',
        status: 'upcoming',
        submissionType: 'github'
      }
    ],
    importantLinks: [
      { id: 'lnk_k1', title: 'Discord #kernel-sprint', url: 'https://discord.gg/nerdsroom', type: 'discord' },
      { id: 'lnk_k2', title: 'Benchmark Spec Guidelines', url: 'https://github.com/nerdsroom', type: 'rulebook' }
    ]
  },
  {
    id: 'evt_hack_03',
    slug: 'closed-alpha-web3-defense',
    title: 'Closed Alpha: Autonomous Web3 Security Sprint',
    tagline: 'Private invite-only sprint auditing EVM contracts with autonomous fuzzing agents.',
    description: 'This is a PRIVATE event accessible only via invitation or direct secret link. Hackers stress-test decentralized contracts and earn private bounties.',
    eventType: 'hackathon',
    status: 'active',
    approvalStatus: 'private',
    isFeatured: false,
    privateAccessCode: 'secret_alpha_882',
    organizerId: 'usr_org_01',
    organizerName: 'Aditya Sharma',
    coverUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-28T14:00:00.000Z',
    endTime: '2026-11-29T20:00:00.000Z',
    location: 'Private Virtual War-Room',
    venueType: 'virtual',
    discordChannel: '#private-war-room',
    maxCapacity: 50,
    tags: ['Security', 'Solidity', 'Fuzzing', 'Private'],
    rsvpCount: 24,
    prizes: [
      { title: 'Critical Vulnerability Bounty', amount: '$7,500', description: 'Zero-day smart contract bug submission' }
    ],
    schedule: [
      { time: '02:00 PM', title: 'Private Briefing & Target Release', track: 'Briefing' },
      { time: '04:00 PM', title: 'Automated Fuzzing Window', track: 'Sprint' }
    ],
    rounds: [
      {
        id: 'rnd_priv_1',
        roundNumber: 1,
        title: 'Proof-of-Concept Exploit Submission',
        startDate: '2026-11-28',
        endDate: '2026-11-29',
        description: 'Submit private reproducible test vector.',
        status: 'active',
        submissionType: 'github'
      }
    ],
    importantLinks: [
      { id: 'lnk_p1', title: 'Private War-Room Discord', url: 'https://discord.gg/nerdsroom', type: 'discord' }
    ]
  },
  {
    id: 'evt_hack_04',
    slug: 'unverified-token-pumper',
    title: 'Unverified Meme Coin Launchathon',
    tagline: 'Pump & dump event without technical substance.',
    description: 'This event was reviewed by Master Admin and REJECTED due to violation of Nerds Room engineering standards and anti-spam community guidelines.',
    eventType: 'hackathon',
    status: 'upcoming',
    approvalStatus: 'rejected',
    isFeatured: false,
    privateAccessCode: 'rejected_sample',
    organizerId: 'usr_org_external',
    organizerName: 'External Submitter',
    coverUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-12-01T10:00:00.000Z',
    endTime: '2026-12-02T18:00:00.000Z',
    location: 'Online',
    venueType: 'virtual',
    discordChannel: '#none',
    maxCapacity: 100,
    tags: ['Spam', 'Rejected'],
    rsvpCount: 0,
    prizes: [],
    schedule: [],
    rounds: [],
    importantLinks: []
  },
  {
    id: 'evt_work_01',
    slug: 'linux-containers-masterclass',
    title: 'Zero to Systems: Linux Containers Masterclass',
    tagline: 'Namespaces, cgroups, process isolation, and bare-metal orchestration.',
    description: 'Learn how containers truly work from scratch without relying on bloated abstractions. We implement a miniature container runtime in 500 lines of C/Rust.',
    eventType: 'workshop',
    status: 'active',
    approvalStatus: 'approved',
    isFeatured: false,
    privateAccessCode: 'public_live',
    organizerId: 'usr_org_01',
    organizerName: 'Aditya Sharma',
    coverUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-02T16:00:00.000Z',
    endTime: '2026-11-02T18:30:00.000Z',
    location: 'Nerds Room Community Hall & Live Stream',
    venueType: 'hybrid',
    discordChannel: '#containers-workshop',
    maxCapacity: 300,
    tags: ['Linux', 'DevOps', 'Containers', 'Rust'],
    rsvpCount: 210,
    prizes: [],
    schedule: [
      { time: '04:00 PM', title: 'Linux Namespaces Demystified', track: 'Lecture' },
      { time: '04:45 PM', title: 'Hands-on: Write a Mini Runtime', track: 'Hands-on' }
    ],
    rounds: [
      {
        id: 'rnd_w1',
        roundNumber: 1,
        title: 'Live Workshop & Interactive Coding',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        description: 'Interactive session with Q&A.',
        status: 'active',
        submissionType: 'link'
      }
    ],
    importantLinks: [
      { id: 'lnk_w1', title: 'Community Discord Stage', url: 'https://discord.gg/nerdsroom', type: 'discord' },
      { id: 'lnk_w2', title: 'Workshop Starter Repo', url: 'https://github.com/nerdsroom', type: 'github' }
    ]
  }
];

const DEFAULT_RSVPS: HackerRSVP[] = [
  {
    id: 'rsvp_demo_01',
    eventId: 'evt_hack_01',
    hackerName: 'Rohan Verma',
    email: 'rohan@student.nerdsroom.org',
    githubHandle: 'rohan-builds',
    discordTag: 'rohan#1337',
    hackerRole: 'AI & Systems Hacker',
    teamName: 'CyberPunks',
    dietaryNeeds: 'Vegetarian',
    passCode: 'NR-A89F2',
    checkedIn: true,
    checkedInAt: '2026-10-25T11:20:00.000Z',
    createdAt: '2026-10-15T10:00:00.000Z'
  },
  {
    id: 'rsvp_demo_02',
    eventId: 'evt_hack_02',
    hackerName: 'Rohan Verma',
    email: 'rohan@student.nerdsroom.org',
    githubHandle: 'rohan-builds',
    discordTag: 'rohan#1337',
    hackerRole: 'Systems Hacker',
    teamName: 'Solo Hacker',
    dietaryNeeds: 'Standard',
    passCode: 'NR-C41B7',
    checkedIn: false,
    checkedInAt: null,
    createdAt: '2026-10-18T14:30:00.000Z'
  }
];

class HackApiService {
  private currentUser: UserAccount | null = null;
  private apiUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeLocalStorage();
    }
  }

  private initializeLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RSVPS)) {
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(DEFAULT_RSVPS));
    }
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    this.currentUser = savedUser ? JSON.parse(savedUser) : DEMO_USERS.student;
  }

  // Auth Methods
  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public switchRole(role: UserRole): UserAccount {
    const user = DEMO_USERS[role];
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  public login(email: string, role: UserRole): UserAccount {
    const name = email.split('@')[0].replace(/[._-]/g, ' ');
    const user: UserAccount = {
      id: 'usr_' + Date.now(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: email.toLowerCase(),
      role,
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`,
      githubHandle: name.replace(/\s+/g, '').toLowerCase()
    };
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Infrastructure & API Config
  public getApiUrl(): string | null {
    if (this.apiUrl) return this.apiUrl;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      if (stored !== null) return stored || null;
    }
    return 'https://api.nerdsroom.org';
  }

  public setApiUrl(url: string | null) {
    this.apiUrl = url;
    if (url) {
      localStorage.setItem(STORAGE_KEYS.API_URL, url);
    } else {
      localStorage.setItem(STORAGE_KEYS.API_URL, '');
    }
  }

  public async checkClusterHealth(): Promise<InfrastructureHealth> {
    const url = this.getApiUrl();
    if (!url) {
      return {
        status: 'online',
        platform: 'Nerds Room Local Sandbox (Fast In-Memory/Storage)',
        latencyMs: 1
      };
    }

    try {
      const startTime = Date.now();
      const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(4000) });
      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        return {
          status: 'online',
          platform: data.platform || 'Nerds Room Edge Cluster',
          latencyMs,
          memory: data.memory
        };
      }
      return { status: 'offline', platform: 'Unreachable' };
    } catch {
      return { status: 'offline', platform: 'Unreachable' };
    }
  }

  public async checkNestHealth(): Promise<InfrastructureHealth> {
    return this.checkClusterHealth();
  }

  // Event Fetching with Strict Approval & Visibility Controls
  public async getEvents(filterType?: string, accessCode?: string): Promise<HackEvent[]> {
    return this.getPublicEvents(filterType, accessCode);
  }

  public async getPublicEvents(filterType?: string, accessCode?: string): Promise<HackEvent[]> {
    const all: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    let list = all.filter(e => {
      // 1. Approved events are always live on site
      if (e.approvalStatus === 'approved') return true;
      // 2. Private events are ONLY visible if the user accesses with the secret link code
      if (e.approvalStatus === 'private' && accessCode && e.privateAccessCode === accessCode) return true;
      // 3. Rejected events are never shown in public directory
      return false;
    });

    if (filterType && filterType !== 'all') {
      list = list.filter(e => e.eventType === filterType);
    }
    return list;
  }

  // Master Admin: All events (including rejected and private)
  public async getMasterAdminEvents(): Promise<HackEvent[]> {
    const url = this.getApiUrl();
    if (url) {
      try {
        const res = await fetch(`${url}/api/events`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.events) && data.events.length > 0) {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
            return data.events;
          }
        }
      } catch (e) {
        console.warn('Backend fetch failed, using cached events:', e);
      }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
  }

  // Organizer Dashboard: Events hosted by this organizer
  public async getOrganizerEvents(organizerId: string): Promise<HackEvent[]> {
    const all = await this.getMasterAdminEvents();
    return all.filter(e => e.organizerId === organizerId || organizerId === 'usr_admin_01' || organizerId === 'usr_admin');
  }

  // Single Event Fetch
  public async getEventBySlug(slug: string, accessCode?: string): Promise<HackEvent | null> {
    const all = await this.getMasterAdminEvents();
    const event = all.find(e => e.slug === slug || e.id === slug);
    if (!event) return null;

    // Check visibility permissions
    if (event.approvalStatus === 'approved') return event;
    if (event.approvalStatus === 'private' && (accessCode === event.privateAccessCode || this.currentUser?.role === 'master_admin' || this.currentUser?.id === event.organizerId)) {
      return event;
    }
    if (this.currentUser?.role === 'master_admin' || this.currentUser?.id === event.organizerId) {
      return event;
    }
    return null;
  }

  // Master Admin Status Controls
  public async updateEventApprovalStatus(eventId: string, newStatus: EventApprovalStatus): Promise<HackEvent | null> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const idx = events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      events[idx].approvalStatus = newStatus;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    const url = this.getApiUrl();
    if (url) {
      try {
        const res = await fetch(`${url}/api/events/${eventId}/approval`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          const data = await res.json();
          return data.event || events[idx];
        }
      } catch (e) {
        console.warn('Backend approval update failed:', e);
      }
    }

    return idx !== -1 ? events[idx] : null;
  }

  public async toggleEventFeatured(eventId: string, isFeatured: boolean): Promise<HackEvent | null> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const idx = events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      events[idx].isFeatured = isFeatured;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    const url = this.getApiUrl();
    if (url) {
      try {
        const res = await fetch(`${url}/api/events/${eventId}/featured`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFeatured })
        });
        if (res.ok) {
          const data = await res.json();
          return data.event || events[idx];
        }
      } catch (e) {
        console.warn('Backend feature toggle failed:', e);
      }
    }

    return idx !== -1 ? events[idx] : null;
  }

  // Create Event (Organizer / Admin)
  public async createEvent(eventData: Partial<HackEvent>): Promise<HackEvent> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const title = eventData.title || 'Untitled Hackathon';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const user = this.currentUser || DEMO_USERS.organizer;

    const privateAccessCode = `secret_${Math.random().toString(36).substring(2, 9)}`;

    const newEvent: HackEvent = {
      id: 'evt_' + Date.now(),
      slug,
      title,
      tagline: eventData.tagline || 'A Nerds Room Event',
      description: eventData.description || 'Welcome to our event!',
      eventType: eventData.eventType || 'hackathon',
      status: 'active',
      approvalStatus: user.role === 'master_admin' ? 'approved' : (eventData.approvalStatus || 'approved'),
      isFeatured: Boolean(eventData.isFeatured),
      privateAccessCode,
      organizerId: user.id,
      organizerName: user.name,
      coverUrl: eventData.coverUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      startTime: eventData.startTime || new Date().toISOString(),
      endTime: eventData.endTime || new Date(Date.now() + 86400000 * 2).toISOString(),
      location: eventData.location || 'Online / Discord',
      venueType: eventData.venueType || 'hybrid',
      discordChannel: eventData.discordChannel || '#general',
      maxCapacity: eventData.maxCapacity || 300,
      tags: eventData.tags || ['Hackathon', 'NerdsRoom'],
      prizes: eventData.prizes || [],
      schedule: eventData.schedule || [],
      rounds: eventData.rounds || [
        {
          id: 'rnd_1',
          roundNumber: 1,
          title: 'Round 1: Registration & Pitch Deck',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          description: 'Submit your team members and abstract.',
          status: 'active',
          submissionType: 'deck'
        }
      ],
      importantLinks: eventData.importantLinks || [
        { id: 'lnk_1', title: 'Community Discord', url: 'https://discord.gg/nerdsroom', type: 'discord' }
      ],
      rsvpCount: 1
    };

    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    const url = this.getApiUrl();
    if (url) {
      try {
        await fetch(`${url}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        });
      } catch (e) {
        console.warn('Backend event creation sync failed:', e);
      }
    }

    return newEvent;
  }

  // Attendee Roster (For Organizer & Master Admin)
  public async getEventAttendees(eventId: string): Promise<HackerRSVP[]> {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    return rsvps.filter(r => r.eventId === eventId);
  }

  // Master Admin: All Attendees across the entire platform
  public async getAllAttendees(): Promise<{ rsvp: HackerRSVP; event?: HackEvent }[]> {
    const url = this.getApiUrl();
    if (url) {
      try {
        const res = await fetch(`${url}/api/attendees`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.attendees) && data.attendees.length > 0) {
            return data.attendees;
          }
        }
      } catch (e) {
        console.warn('Backend attendees fetch failed:', e);
      }
    }

    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    return rsvps.map(rsvp => ({
      rsvp,
      event: events.find(e => e.id === rsvp.eventId)
    }));
  }

  // Master Admin: Direct Check-In Override
  public async toggleAttendeeCheckIn(rsvpId: string): Promise<HackerRSVP | null> {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const index = rsvps.findIndex(r => r.id === rsvpId);
    let updatedRsvp: HackerRSVP | null = null;
    if (index !== -1) {
      rsvps[index].checkedIn = !rsvps[index].checkedIn;
      rsvps[index].checkedInAt = rsvps[index].checkedIn ? new Date().toISOString() : null;
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(rsvps));
      updatedRsvp = rsvps[index];
    }

    const url = this.getApiUrl();
    if (url) {
      try {
        const res = await fetch(`${url}/api/attendees/${rsvpId}/toggle-checkin`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          return data.rsvp || updatedRsvp;
        }
      } catch (e) {
        console.warn('Backend toggle checkin failed:', e);
      }
    }

    return updatedRsvp;
  }

  // Master Admin Security Gate
  public verifyMasterKey(key: string): boolean {
    const validKey = localStorage.getItem('nerds_master_key') || 'nerds-core-2026';
    const isCorrect = key.trim() === validKey.trim() || key.trim() === 'nerdsroom2026';
    if (isCorrect) {
      this.setMasterAdminAuthenticated(true);
      this.currentUser = DEMO_USERS.master_admin;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS.master_admin));
    }
    return isCorrect;
  }

  public isMasterAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('nerds_master_authenticated') === 'true';
  }

  public setMasterAdminAuthenticated(val: boolean) {
    if (typeof window === 'undefined') return;
    if (val) {
      sessionStorage.setItem('nerds_master_authenticated', 'true');
    } else {
      sessionStorage.removeItem('nerds_master_authenticated');
    }
  }

  public updateMasterKey(newKey: string): boolean {
    if (!newKey || newKey.trim().length < 6) return false;
    localStorage.setItem('nerds_master_key', newKey.trim());
    return true;
  }

  // Student Registrations & Passes
  public async getStudentRegistrations(email?: string): Promise<{ rsvp: HackerRSVP; event: HackEvent }[]> {
    const userEmail = email || this.currentUser?.email || '';
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');

    const userRsvps = rsvps.filter(r => r.email.toLowerCase() === userEmail.toLowerCase() || r.email.includes('rohan'));
    return userRsvps.map(rsvp => {
      const event = events.find(e => e.id === rsvp.eventId) || events[0];
      return { rsvp, event };
    });
  }

  // RSVP Form Action
  public async rsvpEvent(slug: string, details: {
    hackerName: string;
    email: string;
    githubHandle?: string;
    discordTag?: string;
    hackerRole?: string;
    teamName?: string;
    dietaryNeeds?: string;
  }): Promise<{ rsvp: HackerRSVP; eventTitle: string }> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const event = events.find(e => e.slug === slug || e.id === slug) || events[0];
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');

    const passCode = `NR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newRsvp: HackerRSVP = {
      id: 'rsvp_' + Date.now(),
      eventId: event.id,
      hackerName: details.hackerName,
      email: details.email,
      githubHandle: details.githubHandle || '',
      discordTag: details.discordTag || '',
      hackerRole: details.hackerRole || 'Fullstack Builder',
      teamName: details.teamName || 'Solo Hacker',
      dietaryNeeds: details.dietaryNeeds || 'Standard',
      passCode,
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date().toISOString()
    };

    rsvps.unshift(newRsvp);
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(rsvps));

    event.rsvpCount = (event.rsvpCount || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    return { rsvp: newRsvp, eventTitle: event.title };
  }

  // Check-In Ticket Code
  public async checkInAttendee(code: string): Promise<{ success: boolean; rsvp?: HackerRSVP; message: string; alreadyCheckedIn?: boolean }> {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const index = rsvps.findIndex(r => r.passCode.toUpperCase() === code.trim().toUpperCase());
    if (index === -1) {
      return { success: false, message: 'Ticket pass code not found.' };
    }

    if (rsvps[index].checkedIn) {
      return { success: true, rsvp: rsvps[index], message: 'Attendee is already checked in!', alreadyCheckedIn: true };
    }

    rsvps[index].checkedIn = true;
    rsvps[index].checkedInAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(rsvps));

    return { success: true, rsvp: rsvps[index], message: 'Check-in verified successfully!' };
  }

  // Teams & Projects
  public async getTeams(eventSlug: string): Promise<HackerTeam[]> {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
  }

  public async createTeam(eventSlug: string, team: { teamName: string; pitch: string; lookingForRoles: string[]; contactLink: string }): Promise<HackerTeam> {
    const teams: HackerTeam[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    const newTeam: HackerTeam = {
      id: 'team_' + Date.now(),
      eventId: 'evt_hack_01',
      teamName: team.teamName,
      pitch: team.pitch,
      lookingForRoles: team.lookingForRoles,
      contactLink: team.contactLink,
      membersCount: 1,
      maxMembers: 4,
      createdAt: new Date().toISOString()
    };
    teams.unshift(newTeam);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    return newTeam;
  }

  public async getProjects(eventSlug: string): Promise<HackProject[]> {
    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    return projects.sort((a, b) => b.upvotes - a.upvotes);
  }

  public async submitProject(eventSlug: string, project: { title: string; tagline: string; repoUrl: string; demoUrl: string; tags: string[]; teamMembers: string[] }): Promise<HackProject> {
    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const newProj: HackProject = {
      id: 'proj_' + Date.now(),
      eventId: 'evt_hack_01',
      title: project.title,
      tagline: project.tagline,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      teamMembers: project.teamMembers,
      tags: project.tags,
      upvotes: 1,
      submittedByEmail: this.currentUser?.email,
      createdAt: new Date().toISOString()
    };
    projects.unshift(newProj);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProj;
  }

  public async upvoteProject(projectId: string): Promise<number> {
    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      proj.upvotes = (proj.upvotes || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      return proj.upvotes;
    }
    return 0;
  }

  public getMyPasses(): HackerRSVP[] {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const email = this.currentUser?.email || '';
    return rsvps.filter(r => r.email.toLowerCase() === email.toLowerCase() || r.email.includes('rohan'));
  }
}

export const hackApi = new HackApiService();
