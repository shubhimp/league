import React, { useState, useEffect, useMemo } from 'react';
import { HackNavbar, NavTab } from './components/HackNavbar';
import { TerminalHero } from './components/TerminalHero';
import { EventCard } from './components/EventCard';
import { HackEventDetails } from './components/HackEventDetails';
import { UserDashboard } from './components/UserDashboard';
import { MasterAdminDashboard } from './components/MasterAdminDashboard';
import { HackerRSVPModal } from './components/HackerRSVPModal';
import { HackerPassModal } from './components/HackerPassModal';
import { TeamBoardModal } from './components/TeamBoardModal';
import { ProjectShipyardModal } from './components/ProjectShipyardModal';
import { OrganizerCheckInModal } from './components/OrganizerCheckInModal';
import { CloudStatusModal } from './components/CloudStatusModal';
import { AuthModal } from './components/AuthModal';
import { CreateEventModal } from './components/CreateEventModal';
import { hackApi, supabase, DEMO_USERS } from './services/hackApi';
import { HackEvent, HackerRSVP, HackerTeam, HackProject, UserAccount } from './types';
import { Terminal, Users, Rocket, Ticket, Plus, Layers, Heart, Sparkles, ExternalLink, ShieldCheck, AlertCircle, X, LogIn } from 'lucide-react';

interface HackHubPageProps {
  onBackToMain?: () => void;
}

export const HackHubPage: React.FC<HackHubPageProps> = ({ onBackToMain }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [events, setEvents] = useState<HackEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authBannerError, setAuthBannerError] = useState('');
  const [eventDetailsRefreshKey, setEventDetailsRefreshKey] = useState(0);

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(hackApi.getCurrentUser());

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<HackEvent | null>(null);
  const [viewingPass, setViewingPass] = useState<HackerRSVP | null>(null);
  const [viewingPassEventTitle, setViewingPassEventTitle] = useState<string>('');
  const [createTeamEvent, setCreateTeamEvent] = useState<HackEvent | null>(null);
  const [submitProjectEvent, setSubmitProjectEvent] = useState<HackEvent | null>(null);
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false);
  const [cloudStatusOpen, setCloudStatusOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  // Teams & Projects global feed
  const [allTeams, setAllTeams] = useState<HackerTeam[]>([]);
  const [allProjects, setAllProjects] = useState<HackProject[]>([]);
  const [myPasses, setMyPasses] = useState<HackerRSVP[]>([]);

  // Check URL parameters & /e/<slug> clean paths for deep-links
  const getUrlParams = () => {
    if (typeof window === 'undefined') return { eventSlug: null, secretCode: null, tab: null };
    const params = new URLSearchParams(window.location.search);
    const pathMatch = window.location.pathname.match(/^\/e\/([^/]+)/);
    return {
      eventSlug: params.get('event') || (pathMatch ? decodeURIComponent(pathMatch[1]) : null),
      secretCode: params.get('secret') || params.get('access'),
      tab: params.get('tab') as NavTab | null,
    };
  };

  const openEventView = (evt: HackEvent, pushUrl = true) => {
    setSelectedEvent(evt);
    if (pushUrl && typeof window !== 'undefined') {
      const targetUrl = `/e/${encodeURIComponent(evt.slug)}${
        evt.approvalStatus === 'private' ? `?secret=${encodeURIComponent(evt.privateAccessCode)}` : ''
      }`;
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ eventSlug: evt.slug }, '', targetUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToTab = (tab: NavTab, pushUrl = true) => {
    setSelectedEvent(null);
    setActiveTab(tab);
    if (pushUrl && typeof window !== 'undefined') {
      const targetUrl = tab === 'events' ? '/' : `/?tab=${encodeURIComponent(tab)}`;
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ tab }, '', targetUrl);
      }
    }
  };

  // Sync Google OAuth / Email Auth session cleanly on mount & auth state changes
  useEffect(() => {
    // Capture OAuth redirect error parameters if present and clean URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthErr =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');
      if (oauthErr) {
        setAuthBannerError(oauthErr.replace(/\+/g, ' '));
        const cleanUrl = window.location.pathname || '/';
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    hackApi.syncSupabaseSession().then(async (syncedUser) => {
      if (syncedUser) {
        setCurrentUser(syncedUser);
        const syncedPasses = await hackApi.syncMyPasses();
        setMyPasses(syncedPasses);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (eventName) => {
      if (eventName === 'SIGNED_IN' || eventName === 'TOKEN_REFRESHED') {
        const synced = await hackApi.syncSupabaseSession();
        if (synced) {
          setCurrentUser(synced);
          const syncedPasses = await hackApi.syncMyPasses();
          setMyPasses(syncedPasses);
        }
      } else if (eventName === 'SIGNED_OUT') {
        setCurrentUser(null);
        setMyPasses([]);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const { secretCode, eventSlug, tab } = getUrlParams();
    
    // Fetch live public events (unlocked by secret link if provided) and global boards in parallel
    const [evts, t, p] = await Promise.all([
      hackApi.getPublicEvents(selectedType, secretCode || undefined),
      hackApi.getTeams(),
      hackApi.getProjects(),
    ]);
    setEvents(evts);
    setAllTeams(t);
    setAllProjects(p);

    if (hackApi.getCurrentUser()) {
      const syncedPasses = await hackApi.syncMyPasses();
      setMyPasses(syncedPasses);
    } else {
      setMyPasses(hackApi.getMyPasses());
    }

    // Direct event deep-link via URL
    let resolvedTarget: HackEvent | null = null;
    if (eventSlug) {
      resolvedTarget = await hackApi.getEventBySlug(eventSlug, secretCode || undefined);
      setSelectedEvent(resolvedTarget);
    }

    // Direct tab parameter (only if no event view active)
    if (tab && !resolvedTarget) {
      if (tab === 'organizer-portal' || tab === 'student-dashboard') {
        setActiveTab('dashboard');
      } else {
        setActiveTab(tab);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedType]);

  // Handle browser Back/Forward navigation smoothly
  useEffect(() => {
    const handlePopState = async () => {
      const { eventSlug, secretCode, tab } = getUrlParams();
      if (eventSlug) {
        const target = await hackApi.getEventBySlug(eventSlug, secretCode || undefined);
        setSelectedEvent(target);
      } else {
        setSelectedEvent(null);
        if (tab) {
          setActiveTab(tab === 'organizer-portal' || tab === 'student-dashboard' ? 'dashboard' : tab);
        } else {
          setActiveTab('events');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Private Core Team Shortcut: Ctrl+Shift+M or Cmd+Shift+M opens Master Gate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        setActiveTab('admin-panel');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.tagline.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [events, searchQuery]);

  const featuredEvent = useMemo(() => {
    return events.find(e => e.isFeatured) || null;
  }, [events]);

  const nextUpcomingEvent = useMemo(() => {
    const now = Date.now();
    const upcoming = events
      .filter((e) => new Date(e.endTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcoming[0] || featuredEvent || events[0] || null;
  }, [events, featuredEvent]);

  const totalHackersCount = useMemo(() => {
    return events.reduce((acc, curr) => acc + (curr.rsvpCount || 0), 0);
  }, [events]);

  const handleRsvpSuccess = (rsvp: HackerRSVP) => {
    setRsvpModalEvent(null);
    setViewingPass(rsvp);
    setViewingPassEventTitle(events.find(e => e.id === rsvp.eventId)?.title || selectedEvent?.title || 'Nerds Room Event');
    setMyPasses(hackApi.getMyPasses());
    setEvents(prev => prev.map(e => e.id === rsvp.eventId ? { ...e, rsvpCount: (e.rsvpCount || 0) + 1 } : e));
    setSelectedEvent(prev => prev && prev.id === rsvp.eventId ? { ...prev, rsvpCount: (prev.rsvpCount || 0) + 1 } : prev);
  };

  const handleUpvoteProject = async (projectId: string) => {
    const newUpvotes = await hackApi.upvoteProject(projectId);
    setAllProjects(prev => prev.map(p => p.id === projectId ? { ...p, upvotes: newUpvotes } : p));
  };

  const handleLogout = async () => {
    await hackApi.logout();
    setCurrentUser(null);
    setMyPasses([]);
    navigateToTab('events');
  };

  const handleSwitchUser = (user: UserAccount) => {
    setCurrentUser(user);
    fetchAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-nerdLime selection:text-nerdDark">
      
      {/* Top Floating Pill Navbar */}
      <HackNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => navigateToTab(tab)}
        onOpenCloudStatus={() => setCloudStatusOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCreateEvent={() => setCreateEventModalOpen(true)}
        onOpenCheckInDesk={() => setOrganizerModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        myPassesCount={myPasses.length}
        onSwitchUser={handleSwitchUser}
      />

      {authBannerError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[900] max-w-lg w-[92%] bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-3 shadow-xl flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-black">Authentication Notice</div>
              <p className="mt-0.5">{authBannerError}</p>
            </div>
          </div>
          <button onClick={() => setAuthBannerError('')} className="p-1 rounded-lg hover:bg-red-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deep-dive Event Details View */}
      {selectedEvent ? (
        <HackEventDetails
          event={selectedEvent}
          refreshKey={eventDetailsRefreshKey}
          existingPass={myPasses.find((p) => p.eventId === selectedEvent.id) || null}
          onViewPass={(rsvp) => {
            setViewingPass(rsvp);
            setViewingPassEventTitle(selectedEvent.title);
          }}
          onBack={() => navigateToTab(activeTab)}
          onRsvpClick={() => setRsvpModalEvent(selectedEvent)}
          onCreateTeamClick={() => setCreateTeamEvent(selectedEvent)}
          onSubmitProjectClick={() => setSubmitProjectEvent(selectedEvent)}
        />
      ) : (
        <>
          {/* COMMON USER & ORGANIZER DASHBOARD */}
          {(activeTab === 'dashboard' || activeTab === 'student-dashboard' || activeTab === 'organizer-portal') && (
            currentUser ? (
              <UserDashboard
                currentUser={currentUser}
                initialMode={activeTab === 'organizer-portal' ? 'hosting' : 'attending'}
                onViewPass={(rsvp, title) => {
                  setViewingPass(rsvp);
                  setViewingPassEventTitle(title);
                }}
                onBrowseEvents={() => navigateToTab('events')}
                onOpenCreateEvent={() => setCreateEventModalOpen(true)}
                onOpenCheckInDesk={() => setOrganizerModalOpen(true)}
                onSelectEvent={(evt) => openEventView(evt)}
              />
            ) : (
              <main className="max-w-xl mx-auto px-4 pt-28 pb-16">
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-nerdBlue flex items-center justify-center mx-auto">
                    <LogIn className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-nerdDark">Sign In to View Your Dashboard</h2>
                  <p className="text-xs text-slate-500">
                    Access your registered hackathon passes, track active rounds, or manage events you host.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Sign In / Create Account
                  </button>
                </div>
              </main>
            )
          )}

          {/* DEDICATED SEPARATE MASTER ADMIN PANEL (PROTECTED GATE) */}
          {activeTab === 'admin-panel' && (
            <MasterAdminDashboard
              onInspectEvent={(evt) => openEventView(evt)}
              onBrowseLiveSite={() => navigateToTab('events')}
              onLockSession={() => navigateToTab('events')}
              onDataMutated={() => fetchAllData()}
            />
          )}

          {/* TAB 1: EVENT DIRECTORY & HERO */}
          {activeTab === 'events' && (
            <>
              {/* Radiant Hero Section with Spotlight */}
              <TerminalHero
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                totalHackers={totalHackersCount}
                eventsCount={events.length}
                featuredEvent={featuredEvent}
                nextEvent={nextUpcomingEvent}
                onSelectFeatured={(evt) => openEventView(evt)}
              />

              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Upcoming Hackathons & Challenges</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-nerdBlue border border-blue-100">
                        {filteredEvents.length} Active
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Register with 1-click, receive your ticket QR pass, and form teams.
                    </p>
                  </div>

                  <button
                    onClick={() => setCreateEventModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4 text-nerdLime" />
                    <span>Host New Event</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-sm text-slate-400 font-medium">
                    <span className="inline-block animate-spin mr-2">⚡</span> Loading events...
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <Terminal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No events found matching your query</h3>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or grepping a different tag.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((evt) => (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        onSelect={(e) => openEventView(e)}
                        onQuickRsvp={(e) => setRsvpModalEvent(e)}
                      />
                    ))}
                  </div>
                )}
              </main>
            </>
          )}

          {/* TAB 2: LOOKING FOR TEAM BOARD */}
          {activeTab === 'teams' && (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-nerdBlue" />
                    <h2 className="text-lg font-black text-slate-900">
                      Hacker Team Matchmaking
                    </h2>
                  </div>
                  <p className="text-slate-600 text-xs font-sans">
                    Solo hackers looking for teammates in AI, Rust, Hardware, and UI. Connect directly or post your idea.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (events.length > 0) {
                      setCreateTeamEvent(events[0]);
                    } else {
                      setCreateEventModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-nerdLime" />
                  <span>{events.length > 0 ? 'Post Team Listing' : 'Host First Event'}</span>
                </button>
              </div>

              {allTeams.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No open team listings yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    Post your hackathon pitch and find co-builders in AI, Systems, Hardware, or Design.
                  </p>
                  <button
                    onClick={() => (events.length > 0 ? setCreateTeamEvent(events[0]) : setCreateEventModalOpen(true))}
                    className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                  >
                    + Post Team Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allTeams.map((team) => (
                  <div key={team.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-base text-slate-900">{team.teamName}</h4>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {team.membersCount}/{team.maxMembers} Members
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                        "{team.pitch}"
                      </p>
                      <div className="mb-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Looking For:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {team.lookingForRoles.map((r, i) => (
                            <span key={i} className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-blue-50 text-nerdBlue border border-blue-100">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <a
                      href={team.contactLink}
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
            </main>
          )}

          {/* TAB 3: PROJECT SHIPYARD GALLERY */}
          {activeTab === 'shipyard' && (
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-5 h-5 text-nerdBlue" />
                    <h2 className="text-lg font-black text-slate-900">
                      Project Shipyard & Demo Arena
                    </h2>
                  </div>
                  <p className="text-slate-600 text-xs font-sans">
                    Hacks shipped during Nerds Room events. Upvote your favorite builds!
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (events.length > 0) {
                      setSubmitProjectEvent(events[0]);
                    } else {
                      setCreateEventModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-nerdLime" />
                  <span>{events.length > 0 ? 'Submit Hack' : 'Host First Event'}</span>
                </button>
              </div>

              {allProjects.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                  <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No shipped projects yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    Submit your GitHub repository and live demo URL to get featured and collect community upvotes.
                  </p>
                  <button
                    onClick={() => (events.length > 0 ? setSubmitProjectEvent(events[0]) : setCreateEventModalOpen(true))}
                    className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                  >
                    + Submit Your Hack
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allProjects.map((proj) => (
                  <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
                    <div className="h-44 bg-slate-100 overflow-hidden relative">
                      <img src={proj.coverImage} alt={proj.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleUpvoteProject(proj.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-nerdBlue text-xs font-bold shadow-md hover:scale-105 transition-all"
                        >
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
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
            </main>
          )}

          {/* TAB 4: MY SAVED PASSES */}
          {activeTab === 'passes' && (
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">
              <div className="flex items-center gap-2 mb-6">
                <Ticket className="w-5 h-5 text-nerdBlue" />
                <h2 className="text-lg font-black text-slate-900">
                  My Event Badges & QR Passes
                </h2>
              </div>

              {myPasses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No active passes in this browser</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    RSVP to an upcoming event to instantly generate your verifiable ticket QR badge.
                  </p>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                  >
                    Browse Events
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myPasses.map((p) => {
                    const evt = events.find(e => e.id === p.eventId);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setViewingPass(p);
                          setViewingPassEventTitle(evt?.title || 'Nerds Room Event');
                        }}
                        className="cursor-pointer bg-white border border-slate-200 hover:border-nerdBlue rounded-2xl p-5 transition-all hover:shadow-lg shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            p.checkedIn 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-blue-50 text-nerdBlue border-blue-200'
                          }`}>
                            {p.checkedIn ? '● CHECKED IN' : 'VALID PASS'}
                          </span>
                          <span className="text-xs font-mono font-bold text-nerdBlue">{p.passCode}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mb-0.5">{p.hackerName}</h4>
                        <div className="text-xs text-nerdBlue font-bold mb-1">{evt?.title || 'Event Pass'}</div>
                        <div className="text-xs text-slate-500 mb-4">{p.hackerRole} • {p.teamName}</div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                          <span>Click to view QR Pass</span>
                          <span className="text-nerdBlue">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 font-sans">
        <div className="flex items-center justify-center gap-2 mb-1 font-bold">
          <span className="text-nerdDark font-black">nerds room<span className="text-nerdLime">.</span></span>
          <span>•</span>
          <span className="text-nerdBlue">league.nerdsroom.org</span>
          <span>•</span>
          <span>Powered by Nerds Room Infrastructure</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Open-Source Multi-Round Event Platform for Hackathons, Ideathons & Community Sprints.
        </p>
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={() => setActiveTab('admin-panel')}
            className="text-[10px] text-slate-300 hover:text-slate-600 transition-colors flex items-center gap-1 font-mono"
            title="Core Team Console Gate (Restricted)"
          >
            <span>🔐 Core Team Gate</span>
          </button>
        </div>
      </footer>

      {/* Active Modals */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            fetchAllData();
          }}
        />
      )}

      {createEventModalOpen && (
        <CreateEventModal
          onClose={() => setCreateEventModalOpen(false)}
          onEventCreated={(newEvent) => {
            setEvents(prev => [newEvent, ...prev]);
            openEventView(newEvent);
          }}
        />
      )}

      {rsvpModalEvent && (
        <HackerRSVPModal
          event={rsvpModalEvent}
          onClose={() => setRsvpModalEvent(null)}
          onRsvpSuccess={handleRsvpSuccess}
        />
      )}

      {viewingPass && (
        <HackerPassModal
          rsvp={viewingPass}
          eventTitle={viewingPassEventTitle || events.find(e => e.id === viewingPass.eventId)?.title}
          onClose={() => setViewingPass(null)}
        />
      )}

      {createTeamEvent && (
        <TeamBoardModal
          eventSlug={createTeamEvent.slug}
          onClose={() => setCreateTeamEvent(null)}
          onTeamCreated={(newTeam) => {
            setAllTeams(prev => [newTeam, ...prev]);
            setCreateTeamEvent(null);
            if (selectedEvent) {
              setEventDetailsRefreshKey(k => k + 1);
            } else {
              navigateToTab('teams');
            }
          }}
        />
      )}

      {submitProjectEvent && (
        <ProjectShipyardModal
          eventSlug={submitProjectEvent.slug}
          onClose={() => setSubmitProjectEvent(null)}
          onProjectSubmitted={(newProj) => {
            setAllProjects(prev => [newProj, ...prev]);
            setSubmitProjectEvent(null);
            if (selectedEvent) {
              setEventDetailsRefreshKey(k => k + 1);
            } else {
              navigateToTab('shipyard');
            }
          }}
        />
      )}

      {organizerModalOpen && (
        <OrganizerCheckInModal
          onClose={() => setOrganizerModalOpen(false)}
          onCheckInSuccess={() => {
            setMyPasses(hackApi.getMyPasses());
          }}
        />
      )}

      {cloudStatusOpen && (
        <CloudStatusModal
          onClose={() => setCloudStatusOpen(false)}
          onRefreshData={() => {
            fetchAllData();
          }}
        />
      )}

    </div>
  );
};

export default HackHubPage;
