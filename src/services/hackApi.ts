import {
  HackEvent,
  HackerRSVP,
  HackerTeam,
  HackProject,
  UserAccount,
  EventApprovalStatus,
  UserRole,
  InfrastructureHealth,
} from '../types';
import { createClient } from '@supabase/supabase-js';

// Shubhi's Active Supabase Instance + Cloudinary CDN
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://zjlatiflzqssrnzvsmhv.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_srr8vcA4OFoECer8u6mMTQ_eAaNvgAt';
export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hanndfsz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const STORAGE_KEYS = {
  EVENTS: 'nerds_league_events',
  RSVPS: 'nerds_league_rsvps',
  TEAMS: 'nerds_league_teams',
  PROJECTS: 'nerds_league_projects',
  CURRENT_USER: 'nerds_league_current_user',
  PENDING_OAUTH_ROLE: 'nerds_league_pending_role',
};

const LEGACY_DEMO_EVENT_IDS = new Set(['evt_hack_01', 'evt_hack_02']);
const LEGACY_DEMO_USER_IDS = new Set(['usr_student_01', 'usr_org_01']);
const LEGACY_DEMO_RSVP_IDS = new Set(['rsvp_demo_01']);

// Row <-> Domain Mappers for Supabase snake_case columns
function mapRowToEvent(row: any): HackEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline || '',
    description: row.description || '',
    eventType: row.event_type || 'hackathon',
    status: row.status || 'active',
    approvalStatus: row.approval_status || 'approved',
    isFeatured: Boolean(row.is_featured),
    privateAccessCode: row.private_access_code || 'public_live',
    organizerId: row.organizer_id || '',
    organizerName: row.organizer_name || 'Nerds Room Community',
    organizerOrg: row.organizer_org || 'Nerds Room Lead Organizer',
    organizerContact: row.organizer_contact || '',
    coverUrl:
      row.cover_url ||
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    startTime: row.start_time || new Date().toISOString(),
    endTime: row.end_time || new Date().toISOString(),
    location: row.location || 'Online / Discord',
    venueType: row.venue_type || 'hybrid',
    discordChannel: row.discord_channel || '#general',
    maxCapacity: row.max_capacity || 300,
    tags: Array.isArray(row.tags) ? row.tags : [],
    prizes: Array.isArray(row.prizes) ? row.prizes : [],
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    rounds: Array.isArray(row.rounds) ? row.rounds : [],
    importantLinks: Array.isArray(row.important_links) ? row.important_links : [],
    rsvpCount: row.rsvp_count ?? 0,
  };
}

function mapEventToRow(evt: HackEvent) {
  return {
    id: evt.id,
    slug: evt.slug,
    title: evt.title,
    tagline: evt.tagline,
    description: evt.description,
    event_type: evt.eventType,
    status: evt.status,
    approval_status: evt.approvalStatus,
    is_featured: evt.isFeatured,
    private_access_code: evt.privateAccessCode,
    organizer_id: evt.organizerId,
    organizer_name: evt.organizerName,
    organizer_org: evt.organizerOrg || 'Nerds Room Lead Organizer',
    organizer_contact: evt.organizerContact || '',
    cover_url: evt.coverUrl,
    start_time: evt.startTime,
    end_time: evt.endTime,
    location: evt.location,
    venue_type: evt.venueType,
    discord_channel: evt.discordChannel,
    max_capacity: evt.maxCapacity,
    tags: evt.tags,
    prizes: evt.prizes,
    schedule: evt.schedule,
    rounds: evt.rounds,
    important_links: evt.importantLinks,
    rsvp_count: evt.rsvpCount ?? 0,
  };
}

function mapRowToRsvp(row: any): HackerRSVP {
  return {
    id: row.id,
    eventId: row.event_id,
    hackerName: row.hacker_name,
    email: row.email,
    githubHandle: row.github_handle || '',
    discordTag: row.discord_tag || '',
    hackerRole: row.hacker_role || 'Fullstack Builder',
    teamName: row.team_name || 'Solo Hacker',
    dietaryNeeds: row.dietary_needs || 'Standard',
    passCode: row.pass_code,
    checkedIn: Boolean(row.checked_in),
    checkedInAt: row.checked_in_at || null,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapRowToTeam(row: any): HackerTeam {
  return {
    id: row.id,
    eventId: row.event_id,
    teamName: row.team_name,
    pitch: row.pitch,
    lookingForRoles: Array.isArray(row.looking_for_roles) ? row.looking_for_roles : [],
    contactLink: row.contact_link || 'https://discord.gg/nerdsroom',
    membersCount: row.members_count || 1,
    maxMembers: row.max_members || 4,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapRowToProject(row: any): HackProject {
  return {
    id: row.id,
    eventId: row.event_id,
    roundId: row.round_id || undefined,
    title: row.title,
    tagline: row.tagline || '',
    repoUrl: row.repo_url,
    demoUrl: row.demo_url || '',
    coverImage:
      row.cover_image ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    teamMembers: Array.isArray(row.team_members) ? row.team_members : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    upvotes: row.upvotes ?? 1,
    submittedByEmail: row.submitted_by_email || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function formatAuthError(rawMessage: string, context: 'signup' | 'signin' | 'google'): string {
  const msg = rawMessage || '';
  const lower = msg.toLowerCase();

  if (context === 'google' && (lower.includes('provider is not enabled') || lower.includes('unsupported provider'))) {
    return 'Google Sign-In is not enabled in Supabase Auth yet. Enable Google under Authentication → Providers in Supabase Dashboard, or sign in with Email and Password.';
  }
  if (lower.includes('email rate limit exceeded') || lower.includes('over_email_send_rate_limit') || lower.includes('rate limit')) {
    return 'Email confirmation limit reached. Please wait a minute and try again, or sign in with Google.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email address is not confirmed yet. Check your inbox for the verification link to activate your account.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Double-check your credentials or create a new account.';
  }
  return msg;
}

class HackApiService {
  private currentUser: UserAccount | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeLocalCache();
    }
  }

  private initializeLocalCache() {
    try {
      const rawEvents: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
      const cleanedEvents = Array.isArray(rawEvents)
        ? rawEvents.filter((e) => !LEGACY_DEMO_EVENT_IDS.has(e.id))
        : [];
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(cleanedEvents));
    } catch {
      localStorage.setItem(STORAGE_KEYS.EVENTS, '[]');
    }

    try {
      const rawRsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
      const cleanedRsvps = Array.isArray(rawRsvps)
        ? rawRsvps.filter((r) => !LEGACY_DEMO_RSVP_IDS.has(r.id) && !LEGACY_DEMO_EVENT_IDS.has(r.eventId))
        : [];
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(cleanedRsvps));
    } catch {
      localStorage.setItem(STORAGE_KEYS.RSVPS, '[]');
    }

    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const parsedUser: UserAccount | null = savedUser ? JSON.parse(savedUser) : null;
      if (parsedUser && LEGACY_DEMO_USER_IDS.has(parsedUser.id)) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        this.currentUser = null;
      } else {
        this.currentUser = parsedUser;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.currentUser = null;
    }
  }

  // ===========================================================================
  // 1. AUTHENTICATION (Email/Password + Google OAuth via Supabase)
  // ===========================================================================

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  private setCurrentUser(user: UserAccount | null) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  }

  public async signUpWithEmail(params: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'organizer';
  }): Promise<{ user?: UserAccount; requiresConfirmation?: boolean; error?: string }> {
    const emailClean = params.email.trim().toLowerCase();
    const assignedRole = params.role || 'student';
    const signupDate =
      new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }) + ' IST';
    const { data, error } = await supabase.auth.signUp({
      email: emailClean,
      password: params.password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          full_name: params.name.trim(),
          role: assignedRole,
          signup_date: signupDate,
        },
      },
    });

    if (error) {
      return { error: formatAuthError(error.message, 'signup') };
    }

    const userId = data.user?.id || 'usr_' + Date.now();
    const profile: UserAccount = {
      id: userId,
      name: params.name.trim(),
      email: emailClean,
      role: assignedRole,
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(params.name.trim())}`,
      githubHandle: params.name.trim().replace(/\s+/g, '').toLowerCase(),
      college: 'Nerds Room Member',
    };

    // Save profile in Supabase league_profiles table
    await this.upsertProfile(profile, 'email');

    if (data.session) {
      this.setCurrentUser(profile);
      return { user: profile };
    }

    // If Supabase requires email confirmation, inform the UI cleanly
    return { user: profile, requiresConfirmation: true };
  }

  public async signInWithEmail(
    email: string,
    password: string,
    fallbackRole: 'student' | 'organizer' = 'student'
  ): Promise<{ user?: UserAccount; error?: string }> {
    const emailClean = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password,
    });

    if (error) {
      return { error: formatAuthError(error.message, 'signin') };
    }

    const user = await this.resolveUserFromAuthUser(data.user, fallbackRole);
    this.setCurrentUser(user);
    return { user };
  }

  public async signInWithGoogle(preferredRole: 'student' | 'organizer' = 'student'): Promise<{ error?: string }> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PENDING_OAUTH_ROLE, preferredRole);
        const currentRelPath = window.location.pathname + window.location.search;
        if (currentRelPath && currentRelPath !== '/') {
          sessionStorage.setItem('nerds_pending_redirect', currentRelPath);
        }
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) return { error: formatAuthError(error.message, 'google') };
      return {};
    } catch (err: any) {
      return { error: formatAuthError(err?.message || 'Google OAuth failed to initialize.', 'google') };
    }
  }

  public async syncSupabaseSession(): Promise<UserAccount | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        return this.currentUser;
      }
      const pendingRole =
        (typeof window !== 'undefined'
          ? (localStorage.getItem(STORAGE_KEYS.PENDING_OAUTH_ROLE) as 'student' | 'organizer' | null)
          : null) || 'student';

      const user = await this.resolveUserFromAuthUser(data.session.user, pendingRole);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.PENDING_OAUTH_ROLE);
      }
      this.setCurrentUser(user);
      return user;
    } catch {
      return this.currentUser;
    }
  }

  private async resolveUserFromAuthUser(
    authUser: any,
    defaultRole: 'student' | 'organizer'
  ): Promise<UserAccount> {
    const email = (authUser.email || '').toLowerCase();
    const meta = authUser.user_metadata || {};

    // Check existing profile in league_profiles first (by auth ID or email)
    try {
      const { data: existing } = await supabase
        .from('league_profiles')
        .select('*')
        .or(`id.eq.${authUser.id},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role as UserRole,
          avatarUrl: existing.avatar_url || meta.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(existing.name)}`,
          githubHandle: existing.github_handle || undefined,
          college: existing.college || undefined,
        };
      }
    } catch {
      // Ignore if league_profiles doesn't exist yet
    }

    const name = meta.full_name || meta.name || email.split('@')[0] || 'Hacker';
    const role: UserRole = meta.role || defaultRole;
    const account: UserAccount = {
      id: authUser.id,
      name,
      email,
      role,
      avatarUrl:
        meta.avatar_url ||
        meta.picture ||
        `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`,
      githubHandle: name.replace(/\s+/g, '').toLowerCase(),
      college: 'Nerds Room Member',
    };

    await this.upsertProfile(account, authUser.app_metadata?.provider || 'google');
    return account;
  }

  private async upsertProfile(user: UserAccount, provider: string) {
    try {
      await supabase.from('league_profiles').upsert(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar_url: user.avatarUrl,
          github_handle: user.githubHandle || null,
          college: user.college || null,
          auth_provider: provider,
        },
        { onConflict: 'email' }
      );
    } catch {
      // Graceful fallback if table hasn't been created yet
    }
  }

  public async getProfiles(): Promise<UserAccount[]> {
    try {
      const { data, error } = await supabase
        .from('league_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: (row.role || 'student') as UserRole,
          avatarUrl: row.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(row.name || 'Member')}`,
          githubHandle: row.github_handle || undefined,
          college: row.college || undefined,
        }));
      }
    } catch {
      // Ignore fallback
    }
    return [];
  }

  public async updateProfileRole(profileId: string, newRole: UserRole): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('league_profiles')
        .update({ role: newRole })
        .eq('id', profileId);
      return !error;
    } catch {
      return false;
    }
  }

  public async logout() {
    this.setCurrentUser(null);
    this.setMasterAdminAuthenticated(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore offline errors
    }
  }

  // ===========================================================================
  // 2. CLOUD HEALTH & CLOUDINARY SIGNED UPLOAD
  // ===========================================================================

  public async checkClusterHealth(): Promise<InfrastructureHealth> {
    const startTime = Date.now();
    let schemaReady = false;
    let cloudinaryConfigured = false;

    try {
      const { error } = await supabase
        .from('league_events')
        .select('id', { count: 'exact', head: true });
      schemaReady = !error;
    } catch {
      schemaReady = false;
    }

    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        cloudinaryConfigured = Boolean(data.cloudinaryConfigured);
        if (typeof data.schemaReady === 'boolean') schemaReady = data.schemaReady;
      }
    } catch {
      // Ignore if health endpoint unavailable
    }

    return {
      status: 'online',
      platform: schemaReady ? 'Supabase + Vercel + Cloudinary' : 'Supabase Connected (Local Cache Active)',
      latencyMs: Date.now() - startTime,
      schemaReady,
      cloudinaryConfigured,
    };
  }

  public async uploadCoverToCloudinary(file: File): Promise<{ url?: string; error?: string }> {
    if (!file.type.startsWith('image/')) {
      return { error: 'Please select a valid image file (PNG, JPG, WebP, or GIF).' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Image is larger than 10 MB. Please choose a smaller banner image.' };
    }

    try {
      const signRes = await fetch('/api/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'nerds-room-league' }),
      });

      const signData = await signRes.json();
      if (!signRes.ok || !signData.configured) {
        return {
          error: signData.error || 'Cloudinary API Secret not configured yet. You can pick a preset cover or paste any image URL below.',
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', signData.folder);

      if (signData.mode === 'unsigned' && signData.uploadPreset) {
        formData.append('upload_preset', signData.uploadPreset);
      } else {
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', String(signData.timestamp));
        formData.append('signature', signData.signature);
      }

      const uploadRes = await fetch(signData.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.secure_url) {
        const rawErr = String(uploadJson?.error?.message || '');
        if (uploadRes.status === 403 || rawErr.toLowerCase().includes('missing permissions') || rawErr.includes('actions=["create"]')) {
          return {
            error:
              'Cloudinary blocked direct upload (403): API Key role needs "Admin" or Upload permission in Cloudinary Console → Settings → API Keys. Pick a preset banner or paste an image URL below.',
          };
        }
        return { error: rawErr || 'Cloudinary upload failed' };
      }

      // Inject f_auto,q_auto optimization cleanly into the CDN URL
      const optimizedUrl = String(uploadJson.secure_url).replace(
        '/upload/',
        '/upload/f_auto,q_auto/'
      );
      return { url: optimizedUrl };
    } catch (err: any) {
      return { error: err?.message || 'Upload error' };
    }
  }

  // ===========================================================================
  // 3. EVENTS & MULTI-ROUND OPERATIONS (100% Supabase + Instant Cache)
  // ===========================================================================

  private async fetchAllEventsRaw(): Promise<HackEvent[]> {
    try {
      const { data, error } = await supabase
        .from('league_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapRowToEvent);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase events query failed, serving fast local cache:', err);
    }

    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    }
    return [];
  }

  public async getEvents(filterType?: string, accessCode?: string): Promise<HackEvent[]> {
    return this.getPublicEvents(filterType, accessCode);
  }

  public async getPublicEvents(filterType?: string, accessCode?: string): Promise<HackEvent[]> {
    const all = await this.fetchAllEventsRaw();
    let list = all.filter((e) => {
      if (e.approvalStatus === 'approved') return true;
      if (e.approvalStatus === 'private' && accessCode && e.privateAccessCode === accessCode) {
        return true;
      }
      return false;
    });

    if (filterType && filterType !== 'all') {
      list = list.filter((e) => e.eventType === filterType);
    }
    return list;
  }

  public async getMasterAdminEvents(): Promise<HackEvent[]> {
    return this.fetchAllEventsRaw();
  }

  public async getOrganizerEvents(organizerId: string): Promise<HackEvent[]> {
    const all = await this.fetchAllEventsRaw();
    const userEmail = (this.currentUser?.email || '').toLowerCase();
    return all.filter(
      (e) =>
        e.organizerId === organizerId ||
        organizerId === 'usr_admin_01' ||
        (Boolean(userEmail) && e.organizerContact?.toLowerCase() === userEmail)
    );
  }

  public async deleteEvent(eventId: string): Promise<boolean> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const filtered = events.filter((e) => e.id !== eventId);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));

    try {
      const { error } = await supabase.from('league_events').delete().eq('id', eventId);
      return !error;
    } catch {
      return false;
    }
  }

  public async getEventBySlug(slug: string, accessCode?: string): Promise<HackEvent | null> {
    const all = await this.fetchAllEventsRaw();
    const event = all.find((e) => e.slug === slug || e.id === slug);
    if (!event) return null;

    if (event.approvalStatus === 'approved') return event;
    if (
      event.approvalStatus === 'private' &&
      (accessCode === event.privateAccessCode ||
        this.isMasterAdminAuthenticated() ||
        this.currentUser?.id === event.organizerId)
    ) {
      return event;
    }
    if (this.isMasterAdminAuthenticated() || this.currentUser?.id === event.organizerId) {
      return event;
    }
    return null;
  }

  public async updateEventApprovalStatus(
    eventId: string,
    newStatus: EventApprovalStatus
  ): Promise<HackEvent | null> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events[idx].approvalStatus = newStatus;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    try {
      const { data, error } = await supabase
        .from('league_events')
        .update({ approval_status: newStatus })
        .eq('id', eventId)
        .select('*')
        .maybeSingle();

      if (!error && data) return mapRowToEvent(data);
    } catch (err) {
      console.warn('Supabase approval update fallback:', err);
    }

    return idx !== -1 ? events[idx] : null;
  }

  public async toggleEventFeatured(eventId: string, isFeatured: boolean): Promise<HackEvent | null> {
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events[idx].isFeatured = isFeatured;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    try {
      const { data, error } = await supabase
        .from('league_events')
        .update({ is_featured: isFeatured })
        .eq('id', eventId)
        .select('*')
        .maybeSingle();

      if (!error && data) return mapRowToEvent(data);
    } catch (err) {
      console.warn('Supabase featured update fallback:', err);
    }

    return idx !== -1 ? events[idx] : null;
  }

  public async createEvent(eventData: Partial<HackEvent>): Promise<HackEvent> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('You must sign in before creating an event.');
    }
    const title = eventData.title || 'Untitled Hackathon';
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    const privateAccessCode = `secret_${Math.random().toString(36).substring(2, 9)}`;

    const newEvent: HackEvent = {
      id: 'evt_' + Date.now(),
      slug,
      title,
      tagline: eventData.tagline || 'A Nerds Room Event',
      description: eventData.description || 'Welcome to our event!',
      eventType: eventData.eventType || 'hackathon',
      status: 'active',
      approvalStatus:
        this.isMasterAdminAuthenticated()
          ? eventData.approvalStatus || 'approved'
          : eventData.approvalStatus || 'approved',
      isFeatured: Boolean(eventData.isFeatured),
      privateAccessCode,
      organizerId: user.id,
      organizerName: eventData.organizerName || user.name,
      organizerOrg: eventData.organizerOrg || user.college || 'Nerds Room Community',
      organizerContact: eventData.organizerContact || user.email,
      coverUrl:
        eventData.coverUrl ||
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      startTime: eventData.startTime || new Date().toISOString(),
      endTime: eventData.endTime || new Date(Date.now() + 86400000 * 2).toISOString(),
      location: eventData.location || 'Online / Discord',
      venueType: eventData.venueType || 'hybrid',
      discordChannel: eventData.discordChannel || '#general',
      maxCapacity: eventData.maxCapacity || 300,
      tags: eventData.tags || ['Hackathon', 'NerdsRoom'],
      prizes: eventData.prizes || [],
      schedule: eventData.schedule || [],
      rounds: eventData.rounds || [],
      importantLinks: eventData.importantLinks || [],
      rsvpCount: 0,
    };

    // Update instant cache
    const events: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Persist in Supabase
    try {
      const { data, error } = await supabase
        .from('league_events')
        .insert(mapEventToRow(newEvent))
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return mapRowToEvent(data);
      }
    } catch (err) {
      console.warn('Supabase createEvent fallback (run schema SQL if missing):', err);
    }

    return newEvent;
  }

  public async updateEvent(
    eventId: string,
    updates: Partial<HackEvent>
  ): Promise<{ event?: HackEvent; error?: string }> {
    const allEvents = await this.fetchAllEventsRaw();
    const existing = allEvents.find((e) => e.id === eventId);
    if (!existing) {
      return { error: 'Event not found.' };
    }

    let cleanSlug = existing.slug;
    if (typeof updates.slug === 'string') {
      cleanSlug = updates.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (cleanSlug.length < 3) {
        return { error: 'Custom URL slug must be at least 3 characters (letters, numbers, hyphens).' };
      }

      const duplicateLocal = allEvents.find((e) => e.id !== eventId && e.slug === cleanSlug);
      if (duplicateLocal) {
        return { error: `The URL slug "/e/${cleanSlug}" is already taken by another event.` };
      }
    }

    const merged: HackEvent = {
      ...existing,
      ...updates,
      id: existing.id,
      slug: cleanSlug,
      rounds: Array.isArray(updates.rounds)
        ? updates.rounds.map((r, i) => ({ ...r, roundNumber: i + 1 }))
        : existing.rounds,
    };

    const rowUpdates: Record<string, any> = {
      slug: merged.slug,
      title: merged.title,
      tagline: merged.tagline,
      description: merged.description,
      event_type: merged.eventType,
      venue_type: merged.venueType,
      location: merged.location,
      start_time: merged.startTime,
      end_time: merged.endTime,
      cover_url: merged.coverUrl,
      organizer_name: merged.organizerName,
      organizer_org: merged.organizerOrg || 'Nerds Room Community',
      tags: merged.tags,
      prizes: merged.prizes,
      rounds: merged.rounds,
      important_links: merged.importantLinks,
      approval_status: merged.approvalStatus,
      is_featured: merged.isFeatured,
    };

    try {
      const { data, error } = await supabase
        .from('league_events')
        .update(rowUpdates)
        .eq('id', eventId)
        .select('*')
        .maybeSingle();

      if (error) {
        if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
          return { error: `The URL slug "/e/${cleanSlug}" is already taken. Choose another one.` };
        }
        return { error: error.message || 'Failed to update event.' };
      }

      const saved = data ? mapRowToEvent(data) : merged;
      if (typeof window !== 'undefined') {
        const cached: HackEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
        const nextList = cached.some((e) => e.id === eventId)
          ? cached.map((e) => (e.id === eventId ? saved : e))
          : [saved, ...cached];
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(nextList));
      }
      return { event: saved };
    } catch (err: any) {
      return { error: err?.message || 'Unable to save event changes.' };
    }
  }

  // ===========================================================================
  // 4. ATTENDEES, RSVPS & QR CHECK-INS
  // ===========================================================================

  private async fetchAllRsvpsRaw(): Promise<HackerRSVP[]> {
    try {
      const { data, error } = await supabase
        .from('league_rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapRowToRsvp);
        localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Fallback
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
  }

  public async getEventAttendees(eventId: string): Promise<HackerRSVP[]> {
    const rsvps = await this.fetchAllRsvpsRaw();
    return rsvps.filter((r) => r.eventId === eventId);
  }

  public async getAllAttendees(): Promise<{ rsvp: HackerRSVP; event?: HackEvent }[]> {
    const [rsvps, events] = await Promise.all([this.fetchAllRsvpsRaw(), this.fetchAllEventsRaw()]);
    return rsvps.map((rsvp) => ({
      rsvp,
      event: events.find((e) => e.id === rsvp.eventId),
    }));
  }

  public async toggleAttendeeCheckIn(rsvpId: string): Promise<HackerRSVP | null> {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const index = rsvps.findIndex((r) => r.id === rsvpId);
    let nextState = true;
    let updatedRsvp: HackerRSVP | null = null;

    if (index !== -1) {
      nextState = !rsvps[index].checkedIn;
      rsvps[index].checkedIn = nextState;
      rsvps[index].checkedInAt = nextState ? new Date().toISOString() : null;
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(rsvps));
      updatedRsvp = rsvps[index];
    }

    try {
      const { data, error } = await supabase
        .from('league_rsvps')
        .update({
          checked_in: nextState,
          checked_in_at: nextState ? new Date().toISOString() : null,
        })
        .eq('id', rsvpId)
        .select('*')
        .maybeSingle();

      if (!error && data) return mapRowToRsvp(data);
    } catch {
      // Fallback
    }

    return updatedRsvp;
  }

  // ===========================================================================
  // 5. MASTER ADMIN SECURITY GATE (Vercel Server-Verified)
  // ===========================================================================

  public async verifyMasterCredentials(
    adminId: string,
    passcode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, passcode }),
      });

      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        return { success: false, error: data.error || 'Invalid Master Admin credentials.' };
      }

      sessionStorage.setItem('nerds_master_authenticated', 'true');
      sessionStorage.setItem('nerds_master_token', data.token || '');
      if (data.admin) {
        this.setCurrentUser(data.admin);
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to verify Master Admin credentials with server.',
      };
    }
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
      sessionStorage.removeItem('nerds_master_token');
      if (this.currentUser?.id === 'usr_admin_01') {
        this.setCurrentUser(null);
      }
    }
  }

  // ===========================================================================
  // 6. STUDENT PASSES, REGISTRATIONS & QR VERIFICATION
  // ===========================================================================

  public async getStudentRegistrations(email?: string): Promise<{ rsvp: HackerRSVP; event: HackEvent }[]> {
    const userEmail = (email || this.currentUser?.email || '').toLowerCase();
    if (!userEmail) return [];
    const [rsvps, events] = await Promise.all([this.fetchAllRsvpsRaw(), this.fetchAllEventsRaw()]);

    const userRsvps = rsvps.filter((r) => r.email.toLowerCase() === userEmail);

    return userRsvps
      .map((rsvp) => {
        const event = events.find((e) => e.id === rsvp.eventId);
        return event ? { rsvp, event } : null;
      })
      .filter((item): item is { rsvp: HackerRSVP; event: HackEvent } => item !== null);
  }

  public async rsvpEvent(
    slug: string,
    details: {
      hackerName: string;
      email: string;
      githubHandle?: string;
      discordTag?: string;
      hackerRole?: string;
      teamName?: string;
      dietaryNeeds?: string;
    }
  ): Promise<{ rsvp: HackerRSVP; eventTitle: string }> {
    const events = await this.fetchAllEventsRaw();
    const event = events.find((e) => e.slug === slug || e.id === slug) || events[0];
    if (!event) {
      throw new Error('Event not found.');
    }
    const passCode = `NR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newRsvp: HackerRSVP = {
      id: 'rsvp_' + Date.now(),
      eventId: event.id,
      hackerName: details.hackerName,
      email: details.email.trim().toLowerCase(),
      githubHandle: details.githubHandle || '',
      discordTag: details.discordTag || '',
      hackerRole: details.hackerRole || 'Fullstack Builder',
      teamName: details.teamName || 'Solo Hacker',
      dietaryNeeds: details.dietaryNeeds || 'Standard',
      passCode,
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };

    // Update instant cache
    const cachedRsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    cachedRsvps.unshift(newRsvp);
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(cachedRsvps));

    event.rsvpCount = (event.rsvpCount || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Persist in Supabase
    try {
      const { data, error } = await supabase
        .from('league_rsvps')
        .insert({
          id: newRsvp.id,
          event_id: newRsvp.eventId,
          hacker_name: newRsvp.hackerName,
          email: newRsvp.email,
          github_handle: newRsvp.githubHandle,
          discord_tag: newRsvp.discordTag,
          hacker_role: newRsvp.hackerRole,
          team_name: newRsvp.teamName,
          dietary_needs: newRsvp.dietaryNeeds,
          pass_code: newRsvp.passCode,
          checked_in: false,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return { rsvp: mapRowToRsvp(data), eventTitle: event.title };
      }
    } catch {
      // Fallback
    }

    return { rsvp: newRsvp, eventTitle: event.title };
  }

  public async checkInAttendee(code: string): Promise<{
    success: boolean;
    rsvp?: HackerRSVP;
    message: string;
    alreadyCheckedIn?: boolean;
  }> {
    const cleanCode = code.trim().toUpperCase();

    try {
      const { data: existing } = await supabase
        .from('league_rsvps')
        .select('*')
        .ilike('pass_code', cleanCode)
        .maybeSingle();

      if (existing) {
        if (existing.checked_in) {
          return {
            success: true,
            rsvp: mapRowToRsvp(existing),
            message: 'Attendee is already checked in!',
            alreadyCheckedIn: true,
          };
        }

        const { data: updated } = await supabase
          .from('league_rsvps')
          .update({ checked_in: true, checked_in_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select('*')
          .maybeSingle();

        return {
          success: true,
          rsvp: mapRowToRsvp(updated || existing),
          message: 'Check-in verified & synced to Supabase!',
        };
      }
    } catch {
      // Fallback to local cache
    }

    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const index = rsvps.findIndex((r) => r.passCode.toUpperCase() === cleanCode);
    if (index === -1) {
      return { success: false, message: 'Ticket pass code not found.' };
    }

    if (rsvps[index].checkedIn) {
      return {
        success: true,
        rsvp: rsvps[index],
        message: 'Attendee is already checked in!',
        alreadyCheckedIn: true,
      };
    }

    rsvps[index].checkedIn = true;
    rsvps[index].checkedInAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(rsvps));
    return { success: true, rsvp: rsvps[index], message: 'Check-in verified!' };
  }

  // ===========================================================================
  // 7. TEAMS & PROJECT SHIPYARD
  // ===========================================================================

  private async resolveEventIdBySlug(eventSlug?: string): Promise<string | null> {
    if (!eventSlug || eventSlug === 'all') return null;
    const all = await this.fetchAllEventsRaw();
    const found = all.find((e) => e.slug === eventSlug || e.id === eventSlug);
    return found?.id || null;
  }

  public async getTeams(eventSlug?: string): Promise<HackerTeam[]> {
    const targetEventId = await this.resolveEventIdBySlug(eventSlug);

    try {
      let query = supabase
        .from('league_teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetEventId) {
        query = query.eq('event_id', targetEventId);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapRowToTeam);
        if (!targetEventId) {
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {
      // Fallback
    }
    const cached: HackerTeam[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    return targetEventId ? cached.filter((t) => t.eventId === targetEventId) : cached;
  }

  public async createTeam(
    eventSlug: string,
    team: { teamName: string; pitch: string; lookingForRoles: string[]; contactLink: string }
  ): Promise<HackerTeam> {
    const events = await this.fetchAllEventsRaw();
    const targetEvent = events.find((e) => e.slug === eventSlug || e.id === eventSlug) || events[0];
    if (!targetEvent) {
      throw new Error('Create or select an event before posting a team listing.');
    }

    const newTeam: HackerTeam = {
      id: 'team_' + Date.now(),
      eventId: targetEvent.id,
      teamName: team.teamName,
      pitch: team.pitch,
      lookingForRoles: team.lookingForRoles,
      contactLink: team.contactLink,
      membersCount: 1,
      maxMembers: 4,
      createdAt: new Date().toISOString(),
    };

    const teams: HackerTeam[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    teams.unshift(newTeam);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));

    try {
      const { data, error } = await supabase
        .from('league_teams')
        .insert({
          id: newTeam.id,
          event_id: newTeam.eventId,
          team_name: newTeam.teamName,
          pitch: newTeam.pitch,
          looking_for_roles: newTeam.lookingForRoles,
          contact_link: newTeam.contactLink,
          members_count: 1,
          max_members: 4,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) return mapRowToTeam(data);
    } catch {
      // Fallback
    }

    return newTeam;
  }

  public async getProjects(eventSlug?: string): Promise<HackProject[]> {
    const targetEventId = await this.resolveEventIdBySlug(eventSlug);

    try {
      let query = supabase
        .from('league_projects')
        .select('*')
        .order('upvotes', { ascending: false });

      if (targetEventId) {
        query = query.eq('event_id', targetEventId);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapRowToProject);
        if (!targetEventId) {
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {
      // Fallback
    }

    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const filtered = targetEventId ? projects.filter((p) => p.eventId === targetEventId) : projects;
    return filtered.sort((a, b) => b.upvotes - a.upvotes);
  }

  public async submitProject(
    eventSlug: string,
    project: {
      title: string;
      tagline: string;
      repoUrl: string;
      demoUrl: string;
      tags: string[];
      teamMembers: string[];
    }
  ): Promise<HackProject> {
    const events = await this.fetchAllEventsRaw();
    const targetEvent = events.find((e) => e.slug === eventSlug || e.id === eventSlug) || events[0];
    if (!targetEvent) {
      throw new Error('Create or select an event before submitting a project.');
    }

    const newProj: HackProject = {
      id: 'proj_' + Date.now(),
      eventId: targetEvent.id,
      title: project.title,
      tagline: project.tagline,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      coverImage:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      teamMembers: project.teamMembers,
      tags: project.tags,
      upvotes: 1,
      submittedByEmail: this.currentUser?.email,
      createdAt: new Date().toISOString(),
    };

    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    projects.unshift(newProj);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    try {
      const { data, error } = await supabase
        .from('league_projects')
        .insert({
          id: newProj.id,
          event_id: newProj.eventId,
          title: newProj.title,
          tagline: newProj.tagline,
          repo_url: newProj.repoUrl,
          demo_url: newProj.demoUrl,
          cover_image: newProj.coverImage,
          team_members: newProj.teamMembers,
          tags: newProj.tags,
          upvotes: 1,
          submitted_by_email: newProj.submittedByEmail || null,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) return mapRowToProject(data);
    } catch {
      // Fallback
    }

    return newProj;
  }

  public async upvoteProject(projectId: string): Promise<number> {
    const projects: HackProject[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const proj = projects.find((p) => p.id === projectId);
    let nextUpvotes = (proj?.upvotes || 0) + 1;

    try {
      const { data: current } = await supabase
        .from('league_projects')
        .select('upvotes')
        .eq('id', projectId)
        .maybeSingle();

      if (typeof current?.upvotes === 'number') {
        nextUpvotes = current.upvotes + 1;
      }

      const { data } = await supabase
        .from('league_projects')
        .update({ upvotes: nextUpvotes })
        .eq('id', projectId)
        .select('upvotes')
        .maybeSingle();

      if (typeof data?.upvotes === 'number') {
        nextUpvotes = data.upvotes;
      }
    } catch {
      // Fallback
    }

    if (proj) {
      proj.upvotes = nextUpvotes;
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }

    return nextUpvotes;
  }

  public async syncMyPasses(): Promise<HackerRSVP[]> {
    await this.fetchAllRsvpsRaw();
    return this.getMyPasses();
  }

  public getMyPasses(): HackerRSVP[] {
    const rsvps: HackerRSVP[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RSVPS) || '[]');
    const email = (this.currentUser?.email || '').toLowerCase();
    if (!email) return [];
    return rsvps.filter((r) => r.email.toLowerCase() === email);
  }
}

export const hackApi = new HackApiService();
