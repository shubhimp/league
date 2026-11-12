import React, { useState, useEffect } from 'react';
import { HackEvent, EventApprovalStatus, UserRole, HackerRSVP, UserAccount } from '../types';
import { hackApi, DEMO_USERS } from '../services/hackApi';
import { 
  ShieldAlert, CheckCircle2, Lock, XCircle, Star, ExternalLink, 
  Search, Users, Layers, Award, Sparkles, KeyRound, Download, 
  Check, LogOut, ShieldCheck, AlertCircle, Filter, Eye, UserCheck, Copy, Trash2
} from 'lucide-react';

interface MasterAdminDashboardProps {
  onInspectEvent: (event: HackEvent) => void;
  onBrowseLiveSite: () => void;
  onLockSession?: () => void;
  onDataMutated?: () => void;
}

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({
  onInspectEvent,
  onBrowseLiveSite,
  onLockSession,
  onDataMutated,
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
    if (isAuthenticated) {
      loadAllData();
    }
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
    } else {
      setAuthError(res.error || 'Invalid Master Admin ID or Passcode. Access denied.');
    }
  };

  const handleLock = () => {
    hackApi.setMasterAdminAuthenticated(false);
    setIsAuthenticated(false);
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
      <div className="min-h-[85vh] flex items-center justify-center px-4 pt-24 pb-16 font-sans">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden text-center">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-nerdDark via-blue-950 to-nerdBlue p-8 text-white relative">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner">
              <Lock className="w-8 h-8 text-nerdLime" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-nerdLime/20 border border-nerdLime/40 text-nerdLime text-[10px] font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3 h-3" />
              <span>CORE TEAM ONLY</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Master Admin Control Gate
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
              Private core-team gateway verified strictly by server credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="p-6 space-y-4 text-xs text-left">
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none transition-all font-mono"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none transition-all font-mono"
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
                ← Return to Public Site
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 font-sans">
      
      {/* Master Admin Header Banner */}
      <div className="bg-gradient-to-r from-nerdDark via-blue-950 to-nerdBlue rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-2 border-purple-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial-gradient from-purple-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/30 border border-purple-400 text-purple-200 text-xs font-black uppercase mb-2 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-nerdLime" />
            <span>CORE TEAM PRIVATE MASTER CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Platform Oversight & Control</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Master Session Active" />
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
            Global authority: Approve events live, issue secret private links, feature flagship hacks, and oversee all platform attendees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={onBrowseLiveSite}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Live Site</span>
          </button>

          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
            title="Lock and terminate Master Admin session"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Master Session</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-black text-nerdDark mb-0.5">{events.length}</div>
          <div className="text-xs font-bold text-slate-500">Total Events</div>
        </div>

        <div className="bg-[#E8F5E9] border-2 border-emerald-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-black text-emerald-700 mb-0.5">{approvedCount}</div>
          <div className="text-xs font-bold text-emerald-800">Approved (Live)</div>
        </div>

        <div className="bg-[#FFF7E0] border-2 border-amber-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-black text-amber-700 mb-0.5">{privateCount}</div>
          <div className="text-xs font-bold text-amber-800">Private (Link Only)</div>
        </div>

        <div className="bg-[#FCE4EC] border-2 border-red-200 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-black text-red-700 mb-0.5">{rejectedCount}</div>
          <div className="text-xs font-bold text-red-800">Rejected</div>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 shadow-sm text-center col-span-2 md:col-span-1">
          <div className="text-2xl font-black text-purple-900 mb-0.5">{allAttendees.length}</div>
          <div className="text-xs font-bold text-purple-800">Total Attendees</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'attendees'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-nerdLime" />
          <span>All Platform Attendees ({allAttendees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Master Security Key</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ALL EVENTS MODERATION QUEUE */}
      {/* ===================================================================== */}
      {activeTab === 'events' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event title or organizer..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-nerdBlue"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto w-full sm:w-auto">
              {[
                { label: 'All', value: 'all' },
                { label: 'Approved (Live)', value: 'approved' },
                { label: 'Private (Link Only)', value: 'private' },
                { label: 'Rejected', value: 'rejected' },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
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

          {/* Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Organizer</th>
                  <th className="py-3 px-4">Visibility Status</th>
                  <th className="py-3 px-4">Feature on Site</th>
                  <th className="py-3 px-4">Actions / Secret Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Event Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                      <div className="text-[11px] text-slate-500">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ALL PLATFORM ATTENDEES ROSTER */}
      {/* ===================================================================== */}
      {activeTab === 'attendees' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-nerdDark">Master Attendee Registry</h3>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={attendeeSearchQuery}
                onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                placeholder="Search attendee, email, pass code, team..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-nerdBlue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Event:</span>
              <select
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-nerdBlue"
              >
                <option value="all">All Events ({allAttendees.length})</option>
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Track & Team</th>
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
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registered Platform Members & Roles ({profiles.length})</h3>
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
                <div key={user.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3 shadow-sm">
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

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Built-in Quick Test Profiles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(DEMO_USERS).map((user) => (
                <div key={user.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-xl border border-slate-200 bg-white" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{user.name}</h4>
                      <span className="text-[11px] text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    user.role === 'organizer'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SERVER SECURITY GATE CONFIGURATION */}
      {/* ===================================================================== */}
      {activeTab === 'security' && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm max-w-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Server-Verified Master Gate</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your Master Admin ID & Passcode are protected exclusively inside server environment variables (never exposed in browser JS).
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
      )}

    </div>
  );
};
