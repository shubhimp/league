import React, { useState, useEffect } from 'react';
import { HackEvent, HackerRSVP, UserAccount } from '../types';
import { hackApi } from '../services/hackApi';
import { 
  Ticket, Layers, Calendar, ArrowRight, ShieldCheck, Users, 
  Clock, ExternalLink, Plus, Shield, Copy, Check, Download, 
  CheckCircle2, AlertCircle, Sparkles, Link as LinkIcon 
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: UserAccount;
  initialMode?: 'attending' | 'hosting';
  onViewPass: (rsvp: HackerRSVP, eventTitle: string) => void;
  onBrowseEvents: () => void;
  onOpenCreateEvent: () => void;
  onOpenCheckInDesk: () => void;
  onSelectEvent: (event: HackEvent) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  initialMode = 'attending',
  onViewPass,
  onBrowseEvents,
  onOpenCreateEvent,
  onOpenCheckInDesk,
  onSelectEvent,
}) => {
  // Main Dashboard Mode: Attending (Student/Attendee) vs Hosting (Organizer Mode)
  const [dashboardMode, setDashboardMode] = useState<'attending' | 'hosting'>(initialMode);

  // Attending state
  const [registrations, setRegistrations] = useState<{ rsvp: HackerRSVP; event: HackEvent }[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  // Hosting state
  const [hostedEvents, setHostedEvents] = useState<HackEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<HackerRSVP[]>([]);
  const [loadingHosted, setLoadingHosted] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [organizerTab, setOrganizerTab] = useState<'events' | 'attendees'>('events');

  useEffect(() => {
    const loadUserData = async () => {
      // 1. Load registrations (Attendee Side)
      setLoadingRegistrations(true);
      const regData = await hackApi.getStudentRegistrations(currentUser.email);
      setRegistrations(regData);
      setLoadingRegistrations(false);

      // 2. Load hosted events (Organizer Side)
      setLoadingHosted(true);
      const evts = await hackApi.getOrganizerEvents(currentUser.id);
      setHostedEvents(evts);
      if (evts.length > 0) {
        setSelectedEventId(evts[0].id);
        const att = await hackApi.getEventAttendees(evts[0].id);
        setAttendees(att);
      }
      setLoadingHosted(false);
    };

    loadUserData();
  }, [currentUser.id, currentUser.email]);

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    const att = await hackApi.getEventAttendees(eventId);
    setAttendees(att);
  };

  const copySecretLink = (event: HackEvent) => {
    const url = `${window.location.origin}/?event=${event.slug}&secret=${event.privateAccessCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(event.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const exportAttendeesCSV = () => {
    if (attendees.length === 0) return;
    const headers = ['Name', 'Email', 'GitHub', 'Discord', 'Role', 'Team', 'Pass Code', 'Checked In'];
    const rows = attendees.map(a => [
      `"${a.hackerName}"`,
      `"${a.email}"`,
      `"${a.githubHandle}"`,
      `"${a.discordTag}"`,
      `"${a.hackerRole}"`,
      `"${a.teamName}"`,
      `"${a.passCode}"`,
      `"${a.checkedIn ? 'YES' : 'NO'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedHostedEvent = hostedEvents.find(e => e.id === selectedEventId) || hostedEvents[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 font-sans">
      
      {/* Unified User Welcome Banner */}
      <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial-gradient from-nerdLime/20 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-nerdLime shadow-md bg-white/10 shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-nerdLime/20 border border-nerdLime/40 text-nerdLime text-xs font-black uppercase mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMMUNITY MEMBER HUB</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
                {currentUser.college || 'Nerds Room Community'} • {currentUser.email}
              </p>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCreateEvent}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-nerdLime hover:bg-lime-400 text-nerdBlue font-black text-xs shadow-md transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Host Event</span>
            </button>

            <button
              onClick={onOpenCheckInDesk}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
            >
              <Shield className="w-4 h-4 text-nerdLime" />
              <span>Check-in Desk</span>
            </button>

            <button
              onClick={onBrowseEvents}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Unified Mode Switcher Pill */}
      <div className="flex items-center justify-between gap-4 mb-8 bg-white border-2 border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setDashboardMode('attending')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
              dashboardMode === 'attending'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Ticket className="w-4 h-4 text-nerdLime" />
            <span>My Registrations & Tickets</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              dashboardMode === 'attending' ? 'bg-nerdLime text-nerdBlue' : 'bg-slate-100 text-slate-700'
            }`}>
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardMode('hosting')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
              dashboardMode === 'hosting'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-nerdLime" />
            <span>My Hosted Events</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              dashboardMode === 'hosting' ? 'bg-nerdLime text-nerdBlue' : 'bg-slate-100 text-slate-700'
            }`}>
              {hostedEvents.length}
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-400 font-medium pr-2">
          {dashboardMode === 'attending' ? 'Tracking your active hackathon progression' : 'Managing your hackathon rounds & attendees'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ATTENDING & STUDENT TICKETS */}
      {/* ========================================================================= */}
      {dashboardMode === 'attending' && (
        <div className="space-y-8">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Events</span>
                <Ticket className="w-4 h-4 text-nerdBlue" />
              </div>
              <div className="text-2xl font-black text-nerdDark">{registrations.length}</div>
              <div className="text-[11px] font-bold text-emerald-600">All Confirmed & Active</div>
            </div>

            <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Active Rounds</span>
                <Layers className="w-4 h-4 text-nerdBlue" />
              </div>
              <div className="text-2xl font-black text-nerdBlue">
                {registrations.reduce((acc, curr) => acc + (curr.event.rounds?.filter(r => r.status === 'active').length || 0), 0)}
              </div>
              <div className="text-[11px] font-bold text-slate-500">In Progress Deadlines</div>
            </div>

            <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">My Teams</span>
                <Users className="w-4 h-4 text-nerdBlue" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {new Set(registrations.map(r => r.rsvp.teamName)).size}
              </div>
              <div className="text-[11px] font-bold text-slate-500">Formed Squads</div>
            </div>
          </div>

          {/* Registered Events List */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-nerdDark flex items-center gap-2">
              <span>My Events & Round Deadlines</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-nerdBlue border border-blue-200">
                {registrations.length} Events
              </span>
            </h2>

            {loadingRegistrations ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                Loading your registered events...
              </div>
            ) : registrations.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">You haven't registered for any events yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Explore upcoming hackathons and claim your free digital QR ticket.
                </p>
                <button
                  onClick={onBrowseEvents}
                  className="px-6 py-2.5 rounded-xl bg-nerdBlue text-white font-black text-xs shadow-md hover:scale-105 transition-all"
                >
                  Browse Events Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map(({ rsvp, event }) => {
                  const activeRound = event.rounds?.find(r => r.status === 'active') || event.rounds?.[0];

                  return (
                    <div
                      key={rsvp.id}
                      className="bg-white border-2 border-slate-200/90 hover:border-nerdBlue rounded-3xl p-6 shadow-sm transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-nerdLime text-nerdBlue font-black text-[10px] uppercase tracking-wider">
                              {event.eventType}
                            </span>
                            <span className="text-xs font-bold text-slate-500 font-mono">
                              Ticket: {rsvp.passCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rsvp.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-nerdBlue'
                            }`}>
                              {rsvp.checkedIn ? '● Checked In' : 'Confirmed'}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-nerdDark">{event.title}</h3>
                          <p className="text-xs text-slate-500">{event.location} • Team: <strong>{rsvp.teamName}</strong></p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewPass(rsvp, event.title)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            <Ticket className="w-4 h-4 text-nerdBlue" />
                            <span>View QR Ticket</span>
                          </button>
                          {event.discordChannel && (
                            <a
                              href="https://discord.gg/nerdsroom"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-nerdBlue font-bold text-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Event Discord</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Round Progression Bar */}
                      {activeRound && (
                        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 mt-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-nerdBlue text-white font-black text-xs flex items-center justify-center">
                              R{activeRound.roundNumber}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900">
                                Current Round: {activeRound.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Deadline: <strong className="text-nerdBlue">{activeRound.endDate}</strong> • Deliverable: {activeRound.submissionType?.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active Now
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: HOSTING & ORGANIZER PORTAL */}
      {/* ========================================================================= */}
      {dashboardMode === 'hosting' && (
        <div className="space-y-6">

          {/* Sub-tabs for Organizer Mode */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setOrganizerTab('events')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                organizerTab === 'events'
                  ? 'bg-nerdBlue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-nerdLime" />
              <span>Hosted Events ({hostedEvents.length})</span>
            </button>

            <button
              onClick={() => setOrganizerTab('attendees')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                organizerTab === 'attendees'
                  ? 'bg-nerdBlue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Attendee List ({attendees.length})</span>
            </button>

            <button
              onClick={onOpenCreateEvent}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-nerdBlue text-white hover:bg-nerdLime hover:text-nerdBlue font-bold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Event</span>
            </button>
          </div>

          {/* Subtab 1: Hosted Events List */}
          {organizerTab === 'events' && (
            <div>
              {loadingHosted ? (
                <div className="py-12 text-center text-slate-400 font-bold text-sm">
                  Loading hosted events...
                </div>
              ) : hostedEvents.length === 0 ? (
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                  <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">You haven't hosted any events yet</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5">
                    Anyone in the Nerds Room community can organize a hackathon, ideathon, or sprint!
                  </p>
                  <button
                    onClick={onOpenCreateEvent}
                    className="px-6 py-2.5 rounded-xl bg-nerdBlue text-white font-black text-xs shadow-md hover:scale-105 transition-all"
                  >
                    + Host Your First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hostedEvents.map((evt) => {
                    const isApproved = evt.approvalStatus === 'approved';
                    const isPrivate = evt.approvalStatus === 'private';
                    const isRejected = evt.approvalStatus === 'rejected';

                    return (
                      <div
                        key={evt.id}
                        className="bg-white border-2 border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="p-5">
                          {/* Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                              {evt.eventType}
                            </span>

                            {isApproved && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved (Live)</span>
                              </span>
                            )}

                            {isPrivate && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>Private (Link Only)</span>
                              </span>
                            )}

                            {isRejected && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-black text-nerdDark mb-1 leading-tight line-clamp-1">
                            {evt.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                            {evt.tagline}
                          </p>

                          <div className="text-xs text-slate-600 space-y-1 mb-4 font-medium">
                            <div>📍 {evt.location}</div>
                            <div>👥 {evt.rsvpCount || 0} Registered Hackers</div>
                            <div>🔄 {evt.rounds?.length || 1} Event Rounds</div>
                          </div>

                          {/* Private Link Copy Tool */}
                          {isPrivate && (
                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 mb-3">
                              <div className="text-[10px] font-bold text-amber-900 mb-1 flex items-center justify-between">
                                <span>SECRET ACCESS LINK:</span>
                                {copiedLink === evt.id ? (
                                  <span className="text-emerald-700 font-black">Copied!</span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-2 py-1 font-mono text-[10px] text-amber-900">
                                <span className="truncate">?secret={evt.privateAccessCode}</span>
                                <button
                                  onClick={() => copySecretLink(evt)}
                                  className="p-1 hover:text-nerdBlue"
                                  title="Copy Secret Access Link"
                                >
                                  {copiedLink === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              handleSelectEvent(evt.id);
                              setOrganizerTab('attendees');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:border-nerdBlue"
                          >
                            View Attendees ({evt.rsvpCount || 0})
                          </button>
                          <button
                            onClick={() => onSelectEvent(evt)}
                            className="px-3.5 py-1.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800"
                          >
                            Inspect Page
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Attendees List */}
          {organizerTab === 'attendees' && selectedHostedEvent && (
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Attendee Roster for:</div>
                  <h3 className="text-xl font-black text-nerdDark">{selectedHostedEvent.title}</h3>
                  <p className="text-xs text-slate-500">{attendees.length} Attendees Registered</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportAttendeesCSV}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <Download className="w-4 h-4 text-nerdBlue" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={onOpenCheckInDesk}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-sm"
                  >
                    <Shield className="w-4 h-4 text-nerdLime" />
                    <span>Check-in Desk</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Attendee</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Specialty Track</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Pass Code</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendees.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{a.hackerName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{a.email}</div>
                          <div className="text-[11px] text-slate-400">@{a.githubHandle || a.discordTag}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-nerdBlue font-bold text-[11px]">
                            {a.hackerRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{a.teamName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-nerdBlue">{a.passCode}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.checkedIn ? '● Checked In' : 'Registered'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
