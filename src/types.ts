export type EventType = 'hackathon' | 'workshop' | 'meetup' | 'ideathon';
export type EventStatus = 'active' | 'upcoming' | 'completed';
export type EventApprovalStatus = 'approved' | 'rejected' | 'private' | 'pending';
export type UserRole = 'student' | 'organizer' | 'master_admin';

export interface EventRound {
  id: string;
  roundNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  submissionType?: 'link' | 'github' | 'deck' | 'offline';
}

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  type: 'discord' | 'whatsapp' | 'rulebook' | 'github' | 'notion' | 'custom';
}

export interface ScheduleItem {
  time: string;
  title: string;
  track: string;
  speaker?: string;
}

export interface PrizeBounty {
  title: string;
  amount: string;
  description: string;
}

export interface HackEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  eventType: EventType;
  status: EventStatus;
  approvalStatus: EventApprovalStatus;
  isFeatured: boolean;
  privateAccessCode: string;
  organizerId: string;
  organizerName: string;
  organizerOrg?: string;
  organizerContact?: string;
  coverUrl: string;
  startTime: string;
  endTime: string;
  location: string;
  venueType: 'in-person' | 'virtual' | 'hybrid';
  discordChannel: string;
  maxCapacity: number;
  tags: string[];
  prizes: PrizeBounty[];
  schedule: ScheduleItem[];
  rounds: EventRound[];
  importantLinks: ImportantLink[];
  rsvpCount?: number;
}

export interface HackerRSVP {
  id: string;
  eventId: string;
  hackerName: string;
  email: string;
  githubHandle: string;
  discordTag: string;
  hackerRole: string;
  teamName: string;
  dietaryNeeds: string;
  passCode: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

export interface HackerTeam {
  id: string;
  eventId: string;
  teamName: string;
  pitch: string;
  lookingForRoles: string[];
  contactLink: string;
  membersCount: number;
  maxMembers: number;
  createdAt: string;
}

export interface HackProject {
  id: string;
  eventId: string;
  roundId?: string;
  title: string;
  tagline: string;
  repoUrl: string;
  demoUrl: string;
  coverImage: string;
  teamMembers: string[];
  tags: string[];
  upvotes: number;
  submittedByEmail?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  githubHandle?: string;
  college?: string;
}

export interface InfrastructureHealth {
  status: 'online' | 'offline' | 'checking';
  platform: string;
  latencyMs?: number;
  memory?: {
    usedMb: number;
    totalMb: number;
  };
}

export type NestClusterHealth = InfrastructureHealth;
