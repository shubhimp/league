import React, { useState, useEffect } from 'react';
import { HackEvent, HackerTeam, HackProject, EventRound, HackerRSVP } from '../types';
import { hackApi } from '../services/hackApi';
import { SocialShareModal } from './SocialShareModal';
import { 
  ArrowLeft, Calendar, MapPin, Trophy, Users, 
  Clock, Shield, ExternalLink, ThumbsUp, Plus, Github, MessageSquare, Rocket,
  Layers, CheckCircle2, AlertCircle, Link as LinkIcon, Share2, Sparkles, UserCheck, Lock, Ticket, Edit3
} from 'lucide-react';

interface HackEventDetailsProps {
  event: HackEvent;
  refreshKey?: number;
  existingPass?: HackerRSVP | null;
  canEdit?: boolean;
  onEditClick?: () => void;
  onViewPass?: (rsvp: HackerRSVP) => void;
  onBack: () => void;
  onRsvpClick: () => void;
  onCreateTeamClick: () => void;
  onSubmitProjectClick: () => void;
}

export const HackEventDetails: React.FC<HackEventDetailsProps> = ({
  event,
  refreshKey = 0,
  existingPass,
  canEdit = false,
  onEditClick,
  onViewPass,
  onBack,
  onRsvpClick,
  onCreateTeamClick,
  onSubmitProjectClick,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rounds' | 'bounties' | 'teams' | 'shipyard'>('rounds');
  const [teams, setTeams] = useState<HackerTeam[]>([]);
  const [projects, setProjects] = useState<HackProject[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchTeamsAndProjects = async () => {
      const t = await hackApi.getTeams(event.slug);
      const p = await hackApi.getProjects(event.slug);
      setTeams(t);
      setProjects(p);
    };
    fetchTeamsAndProjects();
  }, [event.slug, refreshKey]);

  const handleUpvote = async (projectId: string) => {
    const newUpvotes = await hackApi.upvoteProject(projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, upvotes: newUpvotes } : p));
  };

  const startDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const rounds = event.rounds || [];
  const importantLinks = event.importantLinks || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 pt-16 sm:pt-20">
      
      {/* Top Banner Cover (Non-overlapping responsive stack) */}
      <div className="relative min-h-[270px] sm:min-h-[320px] w-full overflow-hidden bg-slate-900 border-b border-slate-200 flex flex-col justify-between p-4 sm:p-8">
        <img
          src={event.coverUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/25" />

        {/* Top Controls: Back & Share / Edit */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 max-w-6xl w-full mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white text-nerdBlue font-black text-xs transition-transform hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
            <span className="hidden sm:inline">to Events</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {event.approvalStatus === 'private' && (
              <span className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-md">
                <Lock className="w-3.5 h-3.5" />
                <span>Private</span>
              </span>
            )}
            {canEdit && onEditClick && (
              <button
                type="button"
                onClick={onEditClick}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white text-nerdBlue font-black text-xs transition-transform hover:scale-105 shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Event</span>
              </button>
            )}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-nerdLime hover:bg-lime-400 text-nerdDark font-black text-xs transition-transform hover:scale-105 shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
              <span className="hidden sm:inline">&amp; Lu.ma Card</span>
            </button>
          </div>
        </div>

        {/* Banner Details */}
        <div className="relative z-10 max-w-6xl w-full mx-auto text-white pt-6 sm:pt-8">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-[11px] sm:text-xs font-bold">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-nerdLime text-nerdDark uppercase tracking-wider">
              {event.eventType}
            </span>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white">
              {event.venueType.toUpperCase()}
            </span>
            <span className="text-slate-200">• {event.rsvpCount || 0} Hackers</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-1.5 sm:mb-2 leading-tight">
            {event.title}
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm font-sans max-w-3xl leading-relaxed">
            {event.tagline}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        
        {/* Quick Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 bg-white border border-slate-200 rounded-2xl p-4 text-xs mb-6 sm:mb-8 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-nerdBlue shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-[10px] font-bold uppercase">DATE &amp; TIME</div>
              <div className="font-bold text-slate-900 text-sm truncate">{startDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-nerdBlue shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-400 text-[10px] font-bold uppercase">VENUE</div>
              <div className="font-bold text-slate-900 text-sm truncate">{event.location}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-lime-50 border border-lime-100 flex items-center justify-center text-nerdDark shrink-0">
              <Trophy className="w-5 h-5 text-nerdDark" />
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 text-[10px] font-bold uppercase">PRIZE POOL</div>
              <div className="font-black text-nerdBlue text-sm truncate">
                {event.prizes.length > 0 ? event.prizes[0].amount : 'Swag & Certificate'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('rounds')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all ${
              activeSubTab === 'rounds'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-nerdLime" />
            <span>Rounds &amp; Overview ({rounds.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bounties')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all ${
              activeSubTab === 'bounties'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Prize Bounties ({event.prizes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('teams')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all ${
              activeSubTab === 'teams'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Matchmaking ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shipyard')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all ${
              activeSubTab === 'shipyard'
                ? 'bg-nerdBlue text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4 text-purple-500" />
            <span>Project Demos ({projects.length})</span>
          </button>
        </div>

        {/* Tab 1: Rounds & Overview */}
        {activeSubTab === 'rounds' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Event Description */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  About this Event
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>

                {/* Tech tags */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {event.tags.map((t, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rounds & Stages (Crucial Feature) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-nerdBlue shrink-0" />
                      <span>Rounds &amp; Progression Stages</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Follow each round deadline to progress to the next stage.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-nerdBlue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0">
                    {rounds.length} {rounds.length === 1 ? 'Round' : 'Total Rounds'}
                  </span>
                </div>

                <div className="space-y-4">
                  {rounds.map((round: EventRound, idx: number) => (
                    <div
                      key={round.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-nerdBlue text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm break-words">{round.title}</h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                          round.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : round.status === 'completed'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-50 text-nerdBlue border border-blue-200'
                        }`}>
                          {round.status === 'active'
                            ? '● Active Now'
                            : round.status === 'completed'
                            ? 'Completed'
                            : 'Upcoming'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-3 pl-0 sm:pl-8">
                        {round.description}
                      </p>

                      <div className="pl-0 sm:pl-8 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-3">
                          <span>Start: <strong>{round.startDate}</strong></span>
                          <span>Deadline: <strong className="text-slate-900">{round.endDate}</strong></span>
                        </div>
                        {round.submissionType && (
                          <span className="text-[11px] font-bold text-nerdBlue bg-white px-2 py-0.5 rounded border border-slate-200">
                            Deliverable: {round.submissionType.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              
              {/* RSVP Action Box */}
              <div className="bg-white border-2 border-nerdBlue/40 rounded-2xl p-6 shadow-md text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-nerdBlue flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  Ready to participate?
                </h4>
                <p className="text-slate-500 text-xs mb-5">
                  100% Free Registration. Instant digital QR pass issued to your profile.
                </p>
                <button
                  onClick={onRsvpClick}
                  className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-md transition-all hover:scale-105"
                >
                  RSVP & GET PASS
                </button>
                {existingPass && onViewPass && (
                  <button
                    type="button"
                    onClick={() => onViewPass(existingPass)}
                    className="mt-2.5 w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <span>View My Ticket ({existingPass.passCode})</span>
                  </button>
                )}
              </div>

              {/* Organizer Profile Card (Feature to show Organizer Name & Team) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  EVENT ORGANIZER
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(event.organizerName || 'NerdsAdmin')}`}
                    alt={event.organizerName || 'Organizer'}
                    className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 p-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span>{event.organizerName || 'Nerds Room Community'}</span>
                      <UserCheck className="w-4 h-4 text-nerdBlue" />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {event.organizerOrg || 'Verified Nerds Room Chapter Lead'}
                    </div>
                  </div>
                </div>
                {canEdit && onEditClick && (
                  <button
                    type="button"
                    onClick={onEditClick}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 hover:bg-nerdBlue text-nerdBlue hover:text-white border border-blue-200 font-bold text-xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Event / URL Slug &amp; Rounds</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-nerdBlue hover:text-white text-slate-800 font-bold text-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Event &amp; Lu.ma Card</span>
                </button>
              </div>

              {/* Important Links & Resources Widget (Crucial Feature) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <LinkIcon className="w-4 h-4 text-nerdBlue" />
                  <span>Important Links & Resources</span>
                </div>
                <p className="text-xs text-slate-500">
                  Access official channels, problem statements, and rules:
                </p>

                <div className="space-y-2 pt-1">
                  {importantLinks.map((link) => {
                    const href = /^https?:\/\//i.test(link.url) ? link.url : `https://${link.url}`;
                    return (
                      <a
                        key={link.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-nerdBlue text-slate-800 hover:text-nerdBlue transition-all group font-bold text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {link.type === 'discord' && <MessageSquare className="w-4 h-4 text-[#5865F2] shrink-0" />}
                          {link.type === 'github' && <Github className="w-4 h-4 text-slate-800 shrink-0" />}
                          {link.type !== 'discord' && link.type !== 'github' && <LinkIcon className="w-4 h-4 text-nerdBlue shrink-0" />}
                          <span className="truncate">{link.title}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-nerdBlue shrink-0 ml-2" />
                      </a>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Prize Bounties */}
        {activeSubTab === 'bounties' && (
          event.prizes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Community Swag, Mentorship & Official Certificates</p>
              <p className="mt-1">No separate monetary tracks listed for this event yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.prizes.map((prize, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 hover:border-nerdBlue rounded-2xl p-6 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-nerdBlue font-bold">
                      BOUNTY TRACK #{idx + 1}
                    </span>
                    <span className="text-xl font-black text-nerdBlue">
                      {prize.amount}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{prize.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{prize.description}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 3: Teams / Matchmaking */}
        {activeSubTab === 'teams' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div>
                <h4 className="text-base font-bold text-slate-900">Looking for Teammates?</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Post your idea or find solo hackers skilled in AI, Rust, Hardware, or Frontend.
                </p>
              </div>
              <button
                onClick={onCreateTeamClick}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-nerdLime" />
                <span>Post Team Listing</span>
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No team listings posted for {event.title} yet</p>
                <p className="mt-1">Be the first builder to post your team pitch above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((t) => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base text-slate-900">{t.teamName}</h4>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {t.membersCount}/{t.maxMembers} Members
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                      "{t.pitch}"
                    </p>
                    <div className="mb-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Looking For:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.lookingForRoles.map((r, i) => (
                          <span key={i} className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-blue-50 text-nerdBlue border border-blue-100">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                <a
                  href={t.contactLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-nerdBlue hover:text-white text-xs font-bold text-slate-800 transition-colors"
                >
                  <span>Connect on Discord</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Shipyard Demos */}
        {activeSubTab === 'shipyard' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div>
                <h4 className="text-base font-bold text-slate-900">Project Shipyard</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Hacks built during {event.title}. Upvote your favorite builds!
                </p>
              </div>
              <button
                onClick={onSubmitProjectClick}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-nerdLime" />
                <span>Submit Your Hack</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
                <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No project demos submitted for {event.title} yet</p>
                <p className="mt-1">Ship your repo & live demo using the Submit button above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="h-44 bg-slate-100 overflow-hidden relative">
                    <img src={proj.coverImage} alt={proj.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleUpvote(proj.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-nerdBlue text-xs font-bold shadow-md hover:scale-105 transition-all"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-nerdBlue" />
                        <span>{proj.upvotes} Upvotes</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 mb-1">{proj.title}</h4>
                      <p className="text-slate-600 text-xs mb-3">{proj.tagline}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {proj.tags.map((tag, i) => (
                          <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <div className="text-slate-500">
                        By: {proj.teamMembers.join(', ')}
                      </div>
                      <div className="flex items-center gap-3">
                        {proj.repoUrl && (
                          <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-nerdBlue font-bold underline">
                            GitHub
                          </a>
                        )}
                        {proj.demoUrl && (
                          <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="text-nerdBlue font-bold hover:underline">
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

      </div>

      {showShareModal && (
        <SocialShareModal
          event={event}
          onClose={() => setShowShareModal(false)}
        />
      )}

    </div>
  );
};
