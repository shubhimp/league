import React, { useState, useEffect } from 'react';
import { HackEvent, EventApprovalStatus, UserRole, HackerRSVP, UserAccount, InfrastructureHealth } from '../types';
import { hackApi } from '../services/hackApi';
import { EditEventModal } from './EditEventModal';
import { CloudStatusModal } from './CloudStatusModal';
import { 
  ShieldAlert, CheckCircle2, Lock, XCircle, Star, ExternalLink, 
  Search, Users, Layers, Award, Sparkles, KeyRound, Download, 
  Check, LogOut, ShieldCheck, AlertCircle, Filter, Eye, UserCheck, Copy, Trash2, Edit3, Globe, Cloud, Database, RefreshCw
} from 'lucide-react';

interface MasterAdminDashboardProps {
  onInspectEvent: (event: HackEvent) => void;
  onBrowseLiveSite: () => void;
  onLockSession?: () => void;
  onDataMutated?: () => void;
  onAdminUnlocked?: (user: UserAccount) => void;
  onEventUpdated?: (event: HackEvent) => void;
}

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({
  onInspectEvent,
  onBrowseLiveSite,
  onLockSession,
  onDataMutated,
  onAdminUnlocked,
  onEventUpdated,
}) => {
  // Authentication gate state (verified strictly via /api/admin-verify)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hackApi.isMasterAdminAuthenticated());
  const [adminIdInput, setAdminIdInput] = useState('');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard state
  const [events, setEvents] = useState<HackEvent[]>([]);
  const [allAttendees, setAllAttendees] = useState<{ rsvp: HackerRSVP; event?: HackEvent }[]>([]);
  const [profiles, setProfiles] = useState<UserAccount[]>([]);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'attendees' | 'roles' | 'security'>('events');
  const [editingEvent, setEditingEvent] = useState<HackEvent | null>(null);
  const [cloudHealth, setCloudHealth] = useState<InfrastructureHealth | null>(null);
  const [cloudStatusOpen, setCloudStatusOpen] = useState(false);
  const [whiteLabelGoogleLive, setWhiteLabelGoogleLive] = useState<boolean | null>(null);

  const loadCloudHealth = async () => {
    const [health, googleProbe] = await Promise.all([
      hackApi.checkClusterHealth(),
      fetch('/api/google-auth?check=1')
        .then((r) => (r.ok ? r.json() : { enabled: false }))
        .catch(() => ({ enabled: false })),
    ]);
    setCloudHealth(health);
    setWhiteLabelGoogleLive(Boolean(googleProbe?.enabled));
  };

  const loadAllData = async () => {
    setLoading(true);
    const [allEvents, attendeesData, fetchedProfiles] = await Promise.all([
      hackApi.getMasterAdminEvents(),
      hackApi.getAllAttendees(),
      hackApi.getProfiles(),
    ]);
    setEvents(allEvents);
    setAllAttendees(attendeesData);
    setProfiles(fetchedProfiles);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAllData();
    loadCloudHealth();
    const interval = setInterval(() => {
      loadCloudHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdInput.trim() || !masterKeyInput.trim()) return;
    setVerifying(true);
    setAuthError('');

    const res = await hackApi.verifyMasterCredentials(adminIdInput, masterKeyInput);
    setVerifying(false);

    if (res.success) {
      setIsAuthenticated(true);
      setAuthError('');
      const unlockedAdmin = hackApi.getCurrentUser();
      if (unlockedAdmin && onAdminUnlocked) {
        onAdminUnlocked(unlockedAdmin);
      }
    } else {
      setAuthError(res.error || 'Invalid Master Admin ID or Passcode. Access denied.');
    }
  };

  const handleLock = () => {
    hackApi.setMasterAdminAuthenticated(false);
    setIsAuthenticated(false);
    setCloudStatusOpen(false);
    setCloudHealth(null);
    setAdminIdInput('');
    setMasterKeyInput('');
    if (onLockSession) onLockSession();
  };

  const handleStatusChange = async (eventId: string, newStatus: EventApprovalStatus) => {
    const updated = await hackApi.updateEventApprovalStatus(eventId, newStatus);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, approvalStatus: newStatus } : e));
      if (onDataMutated) onDataMutated();
    }
  };

  const handleToggleFeatured = async (eventId: string, currentFeatured: boolean) => {
    const updated = await hackApi.toggleEventFeatured(eventId, !currentFeatured);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isFeatured: !currentFeatured } : e));
      if (onDataMutated) onDataMutated();
    }
  };

  const handleDeleteEvent = async (evt: HackEvent) => {
    if (!window.confirm(`Permanently delete "${evt.title}" and its linked RSVPs, teams, and projects?`)) {
      return;
    }
    const ok = await hackApi.deleteEvent(evt.id);
    if (ok) {
      setEvents(prev => prev.filter(e => e.id !== evt.id));
      setAllAttendees(prev => prev.filter(item => item.rsvp.eventId !== evt.id));
      if (onDataMutated) onDataMutated();
    }
  };

  const copyPrivateLink = (evt: HackEvent) => {
    const url = `${window.location.origin}/e/${evt.slug}?secret=${evt.privateAccessCode}`;
    navigator.clipboard.writeText(url);
    setCopiedEventId(evt.id);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const handleProfileRoleChange = async (profileId: string, newRole: UserRole) => {
    const ok = await hackApi.updateProfileRole(profileId, newRole);
    if (ok) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    }
  };

  const handleToggleAttendeeCheckIn = async (rsvpId: string) => {
    const updated = await hackApi.toggleAttendeeCheckIn(rsvpId);
    if (updated) {
      setAllAttendees(prev => prev.map(item => item.rsvp.id === rsvpId ? { ...item, rsvp: updated } : item));
    }
  };

  const exportAllAttendeesCSV = () => {
    if (allAttendees.length === 0) return;
    const headers = ['Attendee Name', 'Email', 'GitHub', 'Discord', 'Role', 'Team', 'Pass Code', 'Event Title', 'Event Type', 'Checked In'];
    const rows = filteredAttendees.map(({ rsvp, event }) => [
      `"${rsvp.hackerName}"`,
      `"${rsvp.email}"`,
      `"${rsvp.githubHandle || ''}"`,
      `"${rsvp.discordTag || ''}"`,
      `"${rsvp.hackerRole}"`,
      `"${rsvp.teamName}"`,
      `"${rsvp.passCode}"`,
      `"${event?.title || 'Unknown Event'}"`,
      `"${event?.eventType || 'hackathon'}"`,
      `"${rsvp.checkedIn ? 'YES' : 'NO'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_attendees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------------------------------------------------------------------
  // SECURITY GATE LOCK SCREEN (IF NOT AUTHENTICATED)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-3.5 sm:px-4 pt-20 sm:pt-24 pb-16 font-sans">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden text-center">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-nerdDark via-blue-950 to-nerdBlue p-6 sm:p-8 text-white relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-nerdLime" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-nerdLime/20 border border-nerdLime/40 text-nerdLime text-[10px] font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3 h-3" />
              <span>CORE TEAM ONLY</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Master Admin Control Gate
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
              Private core-team gateway verified strictly by server credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="p-5 sm:p-6 space-y-4 text-xs text-left">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Master Admin ID</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={adminIdInput}
                  onChange={(e) => {
                    setAdminIdInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Enter Master Admin ID..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Master Passcode</span>
                <span className="text-[10px] text-slate-400 font-normal">Server-Verified</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={masterKeyInput}
                  onChange={(e) => {
                    setMasterKeyInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Enter Master Passcode..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none transition-all font-mono"
                />
              </div>
              {authError && (
                <div className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-nerdLime" />
              <span>{verifying ? 'Verifying Credentials...' : 'Unlock Master Console'}</span>
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-[11px]">
              <button
                type="button"
                onClick={onBrowseLiveSite}
                className="text-slate-400 hover:text-slate-700 font-medium"
              >
                ← Back
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED MASTER ADMIN CONSOLE
  // ---------------------------------------------------------------------------
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.approvalStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAttendees = allAttendees.filter(({ rsvp, event }) => {
    const q = attendeeSearchQuery.toLowerCase().trim();
    const matchesEvent = selectedEventFilter === 'all' || rsvp.eventId === selectedEventFilter;
    if (!q) return matchesEvent;
    const matchesQuery = rsvp.hackerName.toLowerCase().includes(q) ||
                         rsvp.email.toLowerCase().includes(q) ||
                         rsvp.passCode.toLowerCase().includes(q) ||
                         rsvp.teamName.toLowerCase().includes(q) ||
                         (event && event.title.toLowerCase().includes(q));
    return matchesEvent && matchesQuery;
  });

  const approvedCount = events.filter(e => e.approvalStatus === 'approved').length;
  const privateCount = events.filter(e => e.approvalStatus === 'private').length;
  const rejectedCount = events.filter(e => e.approvalStatus === 'rejected').length;
  const featuredCount = events.filter(e => e.isFeatured).length;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 font-sans">
      
      {/* Master Admin Header Banner */}
      <div className="bg-gradient-to-r from-nerdDark via-blue-950 to-nerdBlue rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white mb-6 sm:mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 border-2 border-purple-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial-gradient from-purple-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 min-w-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400 text-purple-200 text-[10px] sm:text-xs font-black uppercase mb-2 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-nerdLime shrink-0" />
            <span>CORE TEAM PRIVATE MASTER CONSOLE</span>
          </div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Platform Oversight &amp; Control</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Master Session Active" />
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
            Global authority: Approve events, edit round titles &amp; URL slugs, issue secret links, and oversee all attendees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 relative z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setCloudStatusOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
            title="Private Core Team Diagnostics: Supabase + Cloudinary + Vercel Cloud Status"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                !cloudHealth || cloudHealth.status === 'checking'
                  ? 'bg-slate-300 animate-pulse'
                  : cloudHealth.schemaReady && cloudHealth.cloudinaryConfigured
                  ? 'bg-nerdLime ring-2 ring-nerdLime/40 animate-pulse'
                  : 'bg-amber-400 ring-2 ring-amber-400/40 animate-pulse'
              }`}
            />
            <span>Cloud Status</span>
          </button>

          <button
            onClick={onBrowseLiveSite}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Live Site</span>
          </button>

          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
            title="Lock and terminate Master Admin session"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Session</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm text-center">
          <div className="text-xl sm:text-2xl font-black text-nerdDark mb-0.5">{events.length}</div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500">Total Events</div>
        </div>

        <div className="bg-[#E8F5E9] border-2 border-emerald-200 rounded-2xl p-3.5 sm:p-4 shadow-sm text-center">
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mb-0.5">{approvedCount}</div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-800">Approved (Live)</div>
        </div>

        <div className="bg-[#FFF7E0] border-2 border-amber-200 rounded-2xl p-3.5 sm:p-4 shadow-sm text-center">
          <div className="text-xl sm:text-2xl font-black text-amber-700 mb-0.5">{privateCount}</div>
          <div className="text-[11px] sm:text-xs font-bold text-amber-800">Private (Link Only)</div>
        </div>

        <div className="bg-[#FCE4EC] border-2 border-red-200 rounded-2xl p-3.5 sm:p-4 shadow-sm text-center">
          <div className="text-xl sm:text-2xl font-black text-red-700 mb-0.5">{rejectedCount}</div>
          <div className="text-[11px] sm:text-xs font-bold text-red-800">Rejected</div>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3.5 sm:p-4 shadow-sm text-center col-span-2 md:col-span-1">
          <div className="text-xl sm:text-2xl font-black text-purple-900 mb-0.5">{allAttendees.length}</div>
          <div className="text-[11px] sm:text-xs font-bold text-purple-800">Total Attendees</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-nerdLime" />
          <span>Events Moderation ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendees')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'attendees'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-nerdLime" />
          <span>All Attendees ({allAttendees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'roles'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Platform Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security &amp; Cloud</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ALL EVENTS MODERATION QUEUE */}
      {/* ===================================================================== */}
      {activeTab === 'events' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event title or organizer..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm sm:text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-nerdBlue"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { label: 'All', value: 'all' },
                { label: 'Approved (Live)', value: 'approved' },
                { label: 'Private (Link Only)', value: 'private' },
                { label: 'Rejected', value: 'rejected' },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
                    filterStatus === tab.value
                      ? 'bg-nerdBlue text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">
              Loading platform events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No events match the selected filter.
            </div>
          ) : (
            <>
              {/* Mobile Event Cards */}
              <div className="md:hidden space-y-3">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-sm truncate">{evt.title}</div>
                        <div className="font-mono text-[11px] text-nerdBlue truncate">/e/{evt.slug}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {evt.eventType.toUpperCase()} • {evt.rsvpCount || 0} RSVPs • {evt.rounds?.length || 1} Rounds
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 shrink-0"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={evt.approvalStatus}
                        onChange={(e) => handleStatusChange(evt.id, e.target.value as EventApprovalStatus)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                          evt.approvalStatus === 'approved'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : evt.approvalStatus === 'private'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}
                      >
                        <option value="approved">Approved (Live on Site)</option>
                        <option value="private">Private (Link Only)</option>
                        <option value="rejected">Rejected (Hidden)</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingEvent(evt)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-nerdBlue font-bold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Slug &amp; Rounds</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(evt.id, evt.isFeatured)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border font-bold ${
                          evt.isFeatured
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${evt.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        <span>{evt.isFeatured ? 'Featured' : 'Feature'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectEvent(evt)}
                        className="px-3 py-1.5 rounded-xl bg-nerdBlue text-white font-bold ml-auto"
                      >
                        Inspect
                      </button>

                      {evt.approvalStatus === 'private' && (
                        <button
                          type="button"
                          onClick={() => copyPrivateLink(evt)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 font-bold"
                        >
                          {copiedEventId === evt.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEventId === evt.id ? 'Copied!' : 'Copy Secret Link'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Events Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Event Details &amp; URL Slug</th>
                      <th className="py-3 px-4">Organizer</th>
                      <th className="py-3 px-4">Visibility Status</th>
                      <th className="py-3 px-4">Feature on Site</th>
                      <th className="py-3 px-4">Actions / Customize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Event Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                          <div className="text-[11px] font-mono text-nerdBlue flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" />
                            <span>/e/{evt.slug}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {evt.eventType.toUpperCase()} • {evt.rsvpCount || 0} RSVPs • {evt.rounds?.length || 1} Rounds
                          </div>
                        </td>

                        {/* Organizer */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <div>{evt.organizerName}</div>
                          <div className="text-[10px] text-slate-400">ID: {evt.organizerId}</div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3.5 px-4">
                          <select
                            value={evt.approvalStatus}
                            onChange={(e) => handleStatusChange(evt.id, e.target.value as EventApprovalStatus)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all ${
                              evt.approvalStatus === 'approved'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : evt.approvalStatus === 'private'
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-red-50 border-red-300 text-red-800'
                            }`}
                          >
                            <option value="approved">Approved (Live on Site)</option>
                            <option value="private">Private (Link Only)</option>
                            <option value="rejected">Rejected (Hidden)</option>
                          </select>
                        </td>

                        {/* Feature on Site Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleFeatured(evt.id, evt.isFeatured)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              evt.isFeatured
                                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                            title="Toggle Featured Event on Homepage Hero"
                          >
                            <Star className={`w-3.5 h-3.5 ${evt.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                            <span>{evt.isFeatured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingEvent(evt)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-nerdBlue border border-blue-200 font-bold transition-colors"
                              title="Edit Round Titles, Custom URL Slug, Banner & Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit / Slug</span>
                            </button>
                            <button
                              onClick={() => onInspectEvent(evt)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-nerdBlue hover:text-white text-slate-700 font-bold transition-colors"
                            >
                              Inspect
                            </button>
                            {evt.approvalStatus === 'private' && (
                              <button
                                type="button"
                                onClick={() => copyPrivateLink(evt)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-200 font-bold transition-colors"
                                title="Copy private invite link"
                              >
                                {copiedEventId === evt.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedEventId === evt.id ? 'Copied Link!' : 'Copy Secret Link'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt)}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ALL PLATFORM ATTENDEES ROSTER */}
      {/* ===================================================================== */}
      {activeTab === 'attendees' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-nerdDark">Master Attendee Registry</h3>
              <p className="text-xs text-slate-500">
                Complete directory of all registered hackers across every event hosted on the platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportAllAttendeesCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 text-nerdLime" />
                <span>Export Master CSV ({filteredAttendees.length})</span>
              </button>
            </div>
          </div>

          {/* Search & Event Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={attendeeSearchQuery}
                onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                placeholder="Search attendee, email, pass code, team..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm sm:text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-nerdBlue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Event:</span>
              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-nerdBlue max-w-full"
              >
                <option value="all">All Events ({allAttendees.length})</option>
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Attendee Cards */}
          <div className="md:hidden space-y-2.5">
            {filteredAttendees.map(({ rsvp, event }) => (
              <div key={rsvp.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{rsvp.hackerName}</div>
                    <div className="text-[11px] text-slate-500 break-all">{rsvp.email}</div>
                    <div className="text-[11px] font-bold text-nerdBlue mt-0.5 truncate">{event?.title || 'Event'}</div>
                  </div>
                  <span className="font-mono font-bold text-nerdBlue shrink-0">{rsvp.passCode}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                  <span className="text-[11px] text-slate-600">{rsvp.teamName} • {rsvp.hackerRole}</span>
                  <button
                    onClick={() => handleToggleAttendeeCheckIn(rsvp.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                      rsvp.checkedIn
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    {rsvp.checkedIn ? 'Revoke Check-In' : 'Admit'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Track &amp; Team</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Check-In Status</th>
                  <th className="py-3 px-4">Master Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendees.map(({ rsvp, event }) => (
                  <tr key={rsvp.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rsvp.hackerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{rsvp.email}</div>
                      <div className="text-[11px] text-slate-400">@{rsvp.githubHandle || rsvp.discordTag || 'none'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{event?.title || 'Unknown'}</div>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {event?.eventType || 'event'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{rsvp.teamName}</div>
                      <span className="text-[11px] text-nerdBlue font-bold">{rsvp.hackerRole}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-nerdBlue">{rsvp.passCode}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rsvp.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rsvp.checkedIn ? '● Checked In' : 'Registered'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAttendeeCheckIn(rsvp.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                          rsvp.checkedIn
                            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {rsvp.checkedIn ? 'Revoke Check-In' : 'Admit & Check In'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PLATFORM ROLE MANAGER */}
      {/* ===================================================================== */}
      {activeTab === 'roles' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registered Platform Members &amp; Roles ({profiles.length})</h3>
            <p className="text-xs text-slate-500">
              Live accounts synced from Supabase <code className="font-mono">league_profiles</code>. Promote community members to Organizer or Master Admin.
            </p>
          </div>

          {profiles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              No users have signed up via Google OAuth or Email yet. New registrations appear here automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profiles.map((user) => (
                <div key={user.id} className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
                      <span className="text-xs text-slate-500 block truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleProfileRoleChange(user.id, e.target.value as UserRole)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-nerdBlue"
                    >
                      <option value="student">Student</option>
                      <option value="organizer">Organizer</option>
                      <option value="master_admin">Master Admin</option>
                    </select>
                    <span className="text-[11px] font-bold text-emerald-700">Synced</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SERVER SECURITY GATE CONFIGURATION & PRIVATE CLOUD DIAGNOSTICS */}
      {/* ===================================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Server-Verified Master Gate</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your Master Admin ID &amp; Passcode are protected exclusively inside server environment variables (never exposed in browser JS).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase shrink-0">
                ● Protected
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <div className="font-bold text-slate-900">How to rotate Master Admin credentials:</div>
              <p className="leading-relaxed">
                Update <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-nerdBlue">MASTER_ADMIN_ID</code> and{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-nerdBlue">MASTER_ADMIN_PASS</code> inside{' '}
                <strong>Vercel Dashboard → Project Settings → Environment Variables</strong> (and <code className="font-mono">.env.local</code> for local testing).
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLock}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Master Session Immediately</span>
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      !cloudHealth || cloudHealth.status === 'checking'
                        ? 'bg-slate-300 animate-pulse'
                        : cloudHealth.schemaReady && cloudHealth.cloudinaryConfigured
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>Supabase &amp; Cloudinary Status</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private Core Team infrastructure telemetry (hidden from public view and regular user dashboards).
                </p>
              </div>
              <button
                type="button"
                onClick={loadCloudHealth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Database className="w-4 h-4 text-nerdBlue" />
                  <span>Supabase PostgreSQL &amp; Auth</span>
                </span>
                <span className={`font-black text-[11px] ${cloudHealth?.schemaReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {!cloudHealth ? 'CHECKING...' : cloudHealth.schemaReady ? `● LIVE (${cloudHealth.latencyMs}ms)` : '● SCHEMA PENDING'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Cloud className="w-4 h-4 text-nerdBlue" />
                  <span>Cloudinary Media CDN</span>
                </span>
                <span className={`font-black text-[11px] ${cloudHealth?.cloudinaryConfigured ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {!cloudHealth ? 'CHECKING...' : cloudHealth.cloudinaryConfigured ? '● SIGNED UPLOADS LIVE' : '● CONNECTED'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Globe className="w-4 h-4 text-nerdBlue" />
                  <span>Custom Google OAuth (league.nerdsroom.org)</span>
                </span>
                <span className={`font-black text-[11px] ${whiteLabelGoogleLive ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {whiteLabelGoogleLive === null
                    ? 'CHECKING...'
                    : whiteLabelGoogleLive
                    ? '● WHITE-LABEL ACTIVE'
                    : '● SUPABASE FALLBACK (ADD GOOGLE KEYS)'}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCloudStatusOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
              >
                <Cloud className="w-4 h-4 text-nerdLime" />
                <span>Open Full Cloud Diagnostics</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          isMasterAdmin={true}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={(updated) => {
            setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setAllAttendees((prev) =>
              prev.map((item) => (item.rsvp.eventId === updated.id ? { ...item, event: updated } : item))
            );
            setEditingEvent(null);
            onDataMutated?.();
            onEventUpdated?.(updated);
          }}
        />
      )}

      {cloudStatusOpen && (
        <CloudStatusModal
          onClose={() => setCloudStatusOpen(false)}
          onRefreshData={() => {
            loadCloudHealth();
            loadAllData();
            onDataMutated?.();
          }}
        />
      )}

    </div>
  );
};
