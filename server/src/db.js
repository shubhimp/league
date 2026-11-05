import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'league_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default seed state
const DEFAULT_STATE = {
  users: [
    {
      id: 'usr_admin',
      email: 'organizer@nerdsroom.org',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
      username: 'root_organizer',
      githubHandle: 'nerds-organizer',
      discordTag: 'organizer#0001',
      role: 'organizer',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NerdsAdmin',
      createdAt: '2026-10-01T00:00:00.000Z'
    }
  ],
  events: [
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
      organizerId: 'usr_admin',
      organizerName: 'Aditya Sharma',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      startTime: '2026-11-15T09:00:00.000Z',
      endTime: '2026-11-16T21:00:00.000Z',
      location: 'Bengaluru / Hybrid & Global Virtual',
      venueType: 'hybrid',
      discordChannel: '#nerdhacks-2026',
      maxCapacity: 500,
      tags: ['AI Agents', 'Rust', 'Linux', 'Hardware', 'Open Source'],
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
          description: 'Live hacking period. Push code to a public GitHub repo and record a 2-minute demo video.',
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
      ],
      createdAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'evt_hack_02',
      slug: 'kernel-and-terminal-sprint',
      title: 'Kernel & Cybernetics Speedrun',
      tagline: 'Write a tiny OS, custom shell, or bootloader in a weekend.',
      description: 'A deep-dive low-level systems hackathon. No boring CRUD apps allowed. Build hyper-minimalist tools, terminal TUIs, RISC-V emulators, and networked daemons.',
      eventType: 'hackathon',
      status: 'upcoming',
      approvalStatus: 'approved',
      isFeatured: true,
      privateAccessCode: 'public_live',
      organizerId: 'usr_admin',
      organizerName: 'Aditya Sharma',
      coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      startTime: '2026-12-05T10:00:00.000Z',
      endTime: '2026-12-06T18:00:00.000Z',
      location: 'Delhi NCR & Live Stream',
      venueType: 'in-person',
      discordChannel: '#kernel-sprint',
      maxCapacity: 200,
      tags: ['C/C++', 'Rust', 'Assembly', 'Linux', 'Retro'],
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
      ],
      createdAt: '2026-10-05T00:00:00.000Z'
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
      organizerId: 'usr_admin',
      organizerName: 'Aditya Sharma',
      coverUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
      startTime: '2026-11-28T14:00:00.000Z',
      endTime: '2026-11-29T20:00:00.000Z',
      location: 'Private Virtual War-Room',
      venueType: 'virtual',
      discordChannel: '#private-war-room',
      maxCapacity: 50,
      tags: ['Security', 'Solidity', 'Fuzzing', 'Private'],
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
        { id: 'lnk_priv_1', title: 'Audited Contracts Repo', url: 'https://github.com/nerdsroom', type: 'github' }
      ],
      createdAt: '2026-10-12T00:00:00.000Z'
    }
  ],
  rsvps: [
    {
      id: 'rsvp_demo_01',
      eventId: 'evt_hack_01',
      hackerName: 'Aditya Sharma',
      email: 'aditya@example.com',
      githubHandle: 'adityasharma',
      discordTag: 'aditya#1337',
      hackerRole: 'AI & Systems',
      teamName: 'CyberPunks',
      dietaryNeeds: 'Vegetarian',
      passCode: 'HACK-PASS-A89F2',
      checkedIn: true,
      checkedInAt: '2026-10-25T11:20:00.000Z',
      createdAt: '2026-10-15T10:00:00.000Z'
    },
    {
      id: 'rsvp_demo_02',
      eventId: 'evt_hack_01',
      hackerName: 'Elena Rostova',
      email: 'elena@example.com',
      githubHandle: 'elena-builds',
      discordTag: 'elena#4040',
      hackerRole: 'Frontend & UI',
      teamName: 'CyberPunks',
      dietaryNeeds: 'None',
      passCode: 'HACK-PASS-C41B7',
      checkedIn: false,
      checkedInAt: null,
      createdAt: '2026-10-16T14:30:00.000Z'
    }
  ],
  teams: [
    {
      id: 'team_01',
      eventId: 'evt_hack_01',
      teamName: 'CyberPunks',
      pitch: 'Building an autonomous local AI agent that audits smart contracts and writes exploits.',
      lookingForRoles: ['Hardware Hacker', 'Rust Specialist'],
      contactLink: 'https://discord.gg/nerdsroom',
      membersCount: 2,
      maxMembers: 4,
      createdAt: '2026-10-16T15:00:00.000Z'
    },
    {
      id: 'team_02',
      eventId: 'evt_hack_01',
      teamName: 'ZeroWatt IoT',
      pitch: 'Ultra low-power environmental mesh networking using solar ESP32 nodes.',
      lookingForRoles: ['Firmware Dev', 'UI Dashboard Hacker'],
      contactLink: 'https://discord.gg/nerdsroom',
      membersCount: 1,
      maxMembers: 3,
      createdAt: '2026-10-17T09:00:00.000Z'
    }
  ],
  projects: [
    {
      id: 'proj_01',
      eventId: 'evt_hack_01',
      title: 'NeuralShell: Voice & Terminal Copilot',
      tagline: 'A local neural network daemon that translates voice directly into piped Linux commands.',
      repoUrl: 'https://github.com/example/neuralshell',
      demoUrl: 'https://neuralshell.hackclub.app',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      teamMembers: ['adityasharma', 'elena-builds'],
      tags: ['Python', 'ONNX', 'Linux', 'AI'],
      upvotes: 42,
      createdAt: '2026-10-20T12:00:00.000Z'
    },
    {
      id: 'proj_02',
      eventId: 'evt_hack_01',
      title: 'MeshPacket: Offline Disaster Comm',
      tagline: 'P2P LoRa radio mesh network for emergency text broadcasting without cellular or internet.',
      repoUrl: 'https://github.com/example/meshpacket',
      demoUrl: 'https://meshpacket.example.org',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      teamMembers: ['hardware-wizard'],
      tags: ['C++', 'ESP32', 'LoRa', 'Hardware'],
      upvotes: 38,
      createdAt: '2026-10-21T08:30:00.000Z'
    }
  ]
};

// Database wrapper
class LeagueDatabase {
  constructor() {
    this.state = this._load();
  }

  _load() {
    if (!fs.existsSync(DB_FILE)) {
      this._save(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('[LeagueDB] Error reading database file, using defaults:', err.message);
      return DEFAULT_STATE;
    }
  }

  _save(stateToSave) {
    fs.writeFileSync(DB_FILE, JSON.stringify(stateToSave || this.state, null, 2), 'utf-8');
  }

  // Generic helpers
  getTable(tableName) {
    if (!this.state[tableName]) {
      this.state[tableName] = [];
    }
    return this.state[tableName];
  }

  insert(tableName, item) {
    const table = this.getTable(tableName);
    table.push(item);
    this._save();
    return item;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    const index = table.findIndex(predicate);
    if (index === -1) return null;
    table[index] = { ...table[index], ...updates };
    this._save();
    return table[index];
  }

  find(tableName, predicate) {
    return this.getTable(tableName).find(predicate);
  }

  filter(tableName, predicate) {
    return this.getTable(tableName).filter(predicate);
  }
}

export const db = new LeagueDatabase();
