import React, { useState, useEffect } from 'react';
import { HackEvent, HackerRSVP, UserAccount } from '../types';
import { hackApi } from '../services/hackApi';
import { 
  Plus, Users, Layers, Shield, Copy, Check, ExternalLink, Download, 
  CheckCircle2, AlertCircle, Eye, Link as LinkIcon 
} from 'lucide-react';

interface OrganizerDashboardProps {
  currentUser: UserAccount;
  onOpenCreateEvent: () => void;
  onOpenCheckInDesk: () => void;
  onSelectEvent: (event: HackEvent) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentUser,
  onOpenCreateEvent,
  onOpenCheckInDesk,
  onSelectEvent,
}) => {
  const [events, setEvents] = useState<HackEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<HackerRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'attendees' | 'rounds'>('events');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const evts = await hackApi.getOrganizerEvents(currentUser.id);
      setEvents(evts);
      if (evts.length > 0) {
        setSelectedEventId(evts[0].id);
        const att = await hackApi.getEventAttendees(evts[0].id);
        setAttendees(att);
      }
      setLoading(false);
    };
    loadEvents();
  }, [currentUser.id]);

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

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 font-sans">
      
      {/* Organizer Header Banner */}
      <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nerdLime text-nerdBlue text-xs font-black uppercase mb-2 shadow-sm">
            <span>ORGANIZER COMMAND CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {currentUser.name}'s Host Portal
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
            Manage your hackathon rounds, review private invite-only links, and admit attendees.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onOpenCheckInDesk}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all"
          >
            <Shield className="w-4 h-4 text-nerdLime" />
            <span>Entrance Scanner</span>
          </button>

          <button
            onClick={onOpenCreateEvent}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nerdLime hover:bg-lime-400 text-nerdBlue font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Host New Event</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs for Organizer */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'events'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-nerdLime" />
          <span>My Hosted Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'attendees'
              ? 'bg-nerdBlue text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Attendee List ({attendees.length})</span>
        </button>
      </div>

      {/* TAB 1: EVENTS ROSTER */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
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
                          <span>Approved (Live on Site)</span>
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
                          <span>Rejected by Admin</span>
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
                      onClick={() => handleSelectEvent(evt.id)}
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
        </div>
      )}

      {/* TAB 2: ATTENDEE LIST & CHECK-IN */}
      {activeTab === 'attendees' && selectedEvent && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Attendee Roster for:</div>
              <h3 className="text-xl font-black text-nerdDark">{selectedEvent.title}</h3>
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
  );
};
