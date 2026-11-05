import React, { useState, useEffect } from 'react';
import { HackerRSVP, HackEvent, UserAccount } from '../types';
import { hackApi } from '../services/hackApi';
import { Ticket, Layers, Calendar, ArrowRight, ShieldCheck, Users, Clock, ExternalLink } from 'lucide-react';

interface StudentDashboardProps {
  currentUser: UserAccount;
  onViewPass: (rsvp: HackerRSVP, eventTitle: string) => void;
  onBrowseEvents: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onViewPass,
  onBrowseEvents,
}) => {
  const [registrations, setRegistrations] = useState<{ rsvp: HackerRSVP; event: HackEvent }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await hackApi.getStudentRegistrations(currentUser.email);
      setRegistrations(data);
      setLoading(false);
    };
    loadData();
  }, [currentUser.email]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 font-sans">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-800 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial-gradient from-nerdLime/20 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl border-2 border-nerdLime shadow-md bg-white/10"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-nerdLime/20 border border-nerdLime/40 text-nerdLime text-xs font-black uppercase mb-1">
                <span>STUDENT HACKER DASHBOARD</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Welcome, {currentUser.name}!
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                {currentUser.college || 'Nerds Room Community Fellow'} • {registrations.length} Active Registrations
              </p>
            </div>
          </div>

          <button
            onClick={onBrowseEvents}
            className="flex items-center gap-1.5 bg-nerdLime hover:bg-lime-400 text-nerdBlue font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
          >
            <span>Browse More Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      {/* Registered Events with Rounds Progression */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-nerdDark flex items-center gap-2">
          <span>My Events & Round Deadlines</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-nerdBlue border border-blue-200">
            {registrations.length} Events
          </span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">
            Loading your dashboard...
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
  );
};
