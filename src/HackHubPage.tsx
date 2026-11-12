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
import { AuthModal } from './components/AuthModal';
import { EmailConfirmGate } from './components/EmailConfirmGate';
import { CreateEventModal } from './components/CreateEventModal';
import { EditEventModal } from './components/EditEventModal';
import { hackApi, supabase } from './services/hackApi';
import type { EmailOtpType } from '@supabase/supabase-js';
import { HackEvent, HackerRSVP, HackerTeam, HackProject, UserAccount } from './types';
import { Terminal, Users, Rocket, Ticket, Plus, Layers, Heart, Sparkles, ExternalLink, ShieldCheck, AlertCircle, X, Lock, ArrowLeft } from 'lucide-react';

interface HackHubPageProps {
  onBackToMain?: () => void;
}

export const HackHubPage: React.FC<HackHubPageProps> = ({ onBackToMain }) => {
  // Check URL parameters & clean paths (/e/<slug>, /core-admin, /auth/confirm) for deep-links
  const getUrlParams = () => {
    if (typeof window === 'undefined') {
      return { eventSlug: null, secretCode: null, tab: null, confirmTokenHash: null, confirmType: null };
    }
    const params = new URLSearchParams(window.location.search);
    const normalizedPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    const pathMatch = window.location.pathname.match(/^\/e\/([^/]+)/);
    const isCoreAdminPath = normalizedPath === '/core-admin' || normalizedPath === '/admin';
    const tokenHash = params.get('token_hash');
    const otpType = (params.get('type') as EmailOtpType | null) || (normalizedPath === '/auth/confirm' ? 'signup' : null);
    return {
      eventSlug: params.get('event') || (pathMatch ? decodeURIComponent(pathMatch[1]) : null),
      secretCode: params.get('secret') || params.get('access'),
      tab: isCoreAdminPath ? ('admin-panel' as NavTab) : (params.get('tab') as NavTab | null),
      confirmTokenHash: tokenHash,
      confirmType: otpType,
    };
  };

  const [confirmParams, setConfirmParams] = useState<{ tokenHash: string; type: EmailOtpType } | null>(() => {
    const { confirmTokenHash, confirmType } = getUrlParams();
    if (confirmTokenHash && confirmType) {
      return { tokenHash: confirmTokenHash, type: confirmType };
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const { tab } = getUrlParams();
    if (!tab) return 'events';
    return tab === 'student-dashboard' ? 'dashboard' : tab;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [events, setEvents] = useState<HackEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authBannerError, setAuthBannerError] = useState('');
  const [eventDetailsRefreshKey, setEventDetailsRefreshKey] = useState(0);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(hackApi.getCurrentUser());

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<HackEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<HackEvent | null>(null);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<HackEvent | null>(null);
  const [viewingPass, setViewingPass] = useState<HackerRSVP | null>(null);
  const [viewingPassEventTitle, setViewingPassEventTitle] = useState<string>('');
  const [createTeamEvent, setCreateTeamEvent] = useState<HackEvent | null>(null);
  const [submitProjectEvent, setSubmitProjectEvent] = useState<HackEvent | null>(null);
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  // Teams & Projects global feed
  const [allTeams, setAllTeams] = useState<HackerTeam[]>([]);
  const [allProjects, setAllProjects] = useState<HackProject[]>([]);
  const [myPasses, setMyPasses] = useState<HackerRSVP[]>([]);

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
      const targetUrl =
        tab === 'events'
          ? '/'
          : tab === 'admin-panel'
          ? '/core-admin'
          : `/?tab=${encodeURIComponent(tab)}`;
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({ tab }, '', targetUrl);
      }
    }
  };

  const clearPlatformState = () => {
    setEvents([]);
    setAllTeams([]);
    setAllProjects([]);
    setMyPasses([]);
    setSelectedEvent(null);
    setEditingEvent(null);
    setRsvpModalEvent(null);
    setViewingPass(null);
    setCreateTeamEvent(null);
    setSubmitProjectEvent(null);
    setCreateEventModalOpen(false);
    setOrganizerModalOpen(false);
    setAuthModalOpen(false);
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

    const restorePendingRedirect = () => {
      if (typeof window === 'undefined') return;
      const pendingRedirect = sessionStorage.getItem('nerds_pending_redirect');
      if (pendingRedirect && window.location.pathname === '/') {
        sessionStorage.removeItem('nerds_pending_redirect');
        window.history.replaceState({}, '', pendingRedirect);
      } else {
        sessionStorage.removeItem('nerds_pending_redirect');
      }
    };

    hackApi.syncSupabaseSession().then(async (syncedUser) => {
      if (syncedUser) {
        restorePendingRedirect();
        setCurrentUser(syncedUser);
        const syncedPasses = await hackApi.syncMyPasses();
        setMyPasses(syncedPasses);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (eventName) => {
      if (eventName === 'SIGNED_IN' || eventName === 'TOKEN_REFRESHED') {
        const synced = await hackApi.syncSupabaseSession();
        if (synced) {
          restorePendingRedirect();
          setCurrentUser(synced);
          const syncedPasses = await hackApi.syncMyPasses();
          setMyPasses(syncedPasses);
        }
      } else if (eventName === 'SIGNED_OUT') {
        setCurrentUser(null);
        clearPlatformState();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchAllData = async () => {
    if (!hackApi.getCurrentUser()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { secretCode, eventSlug, tab } = getUrlParams();
    
    // Fetch live public events (unlocked by secret link if provided) and global boards in parallel
    const [evts, t, p, syncedPasses] = await Promise.all([
      hackApi.getPublicEvents(selectedType, secretCode || undefined),
      hackApi.getTeams(),
      hackApi.getProjects(),
      hackApi.syncMyPasses(),
    ]);
    setEvents(evts);
    setAllTeams(t);
    setAllProjects(p);
    setMyPasses(syncedPasses);

    // Direct event deep-link via URL
    let resolvedTarget: HackEvent | null = null;
    if (eventSlug) {
      resolvedTarget = await hackApi.getEventBySlug(eventSlug, secretCode || undefined);
      setSelectedEvent(resolvedTarget);
    }

    // Direct tab parameter (only if no event view active)
    if (tab && !resolvedTarget) {
      if (tab === 'student-dashboard') {
        setActiveTab('dashboard');
      } else {
        setActiveTab(tab);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [selectedType, currentUser?.id]);

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
          setActiveTab(tab === 'student-dashboard' ? 'dashboard' : tab);
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
        setSelectedEvent(null);
        setActiveTab('admin-panel');
        if (typeof window !== 'undefined' && window.location.pathname !== '/core-admin') {
          window.history.pushState({ tab: 'admin-panel' }, '', '/core-admin');
        }
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
    clearPlatformState();
    navigateToTab('events');
  };

  const handleOpenCreateEvent = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setCreateEventModalOpen(true);
  };

  const handleOpenCheckInDesk = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setOrganizerModalOpen(true);
  };

  const handleEventUpdated = (updated: HackEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEvent((prev) => {
      if (prev && prev.id === updated.id) {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/e/')) {
          const targetUrl = `/e/${encodeURIComponent(updated.slug)}${
            updated.approvalStatus === 'private'
              ? `?secret=${encodeURIComponent(updated.privateAccessCode)}`
              : ''
          }`;
          window.history.replaceState({ eventSlug: updated.slug }, '', targetUrl);
        }
        return updated;
      }
      return prev;
    });
    setDashboardRefreshKey((k) => k + 1);
    setEventDetailsRefreshKey((k) => k + 1);
    fetchAllData();
  };

  const canEditSelectedEvent = Boolean(
    selectedEvent &&
      currentUser &&
      (hackApi.isMasterAdminAuthenticated() ||
        selectedEvent.organizerId === currentUser.id ||
        (selectedEvent.organizerContact &&
          selectedEvent.organizerContact.toLowerCase() === currentUser.email.toLowerCase()))
  );

  const urlParams = getUrlParams();

  if (confirmParams) {
    return (
      <EmailConfirmGate
        tokenHash={confirmParams.tokenHash}
        otpType={confirmParams.type}
        onVerified={(user) => {
          setConfirmParams(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
          if (user) {
            setCurrentUser(user);
          }
          fetchAllData();
        }}
        onBackToSignIn={() => {
          setConfirmParams(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }}
      />
    );
  }

  // Signed-Out Members-Only Lock Gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-nerdLime selection:text-nerdDark flex flex-col">
        {/* Compact Members-Only Header */}
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto h-14 flex items-center justify-between gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateToTab('events');
              }}
              className="flex items-center gap-2 shrink-0"
            >
              <img
                src="/logo.png"
                alt="Nerds Room Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-md"
              />
              <span className="font-black text-base sm:text-xl tracking-tight text-nerdBlue whitespace-nowrap">
                nerds room<span className="text-nerdLime">.</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-nerdLime text-nerdBlue text-[10px] font-black uppercase tracking-wider shadow-sm">
                LEAGUE
              </span>
            </a>

            <div className="flex items-center gap-2">
              {activeTab === 'admin-panel' ? (
                <button
                  onClick={() => navigateToTab('events')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-nerdBlue text-xs font-bold text-slate-700 hover:text-nerdBlue bg-white transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                  <Lock className="w-3 h-3 text-nerdBlue" />
                  <span className="hidden xs:inline">Members-Only</span>
                </span>
              )}
              {onBackToMain && activeTab !== 'admin-panel' && (
                <button
                  onClick={onBackToMain}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-nerdBlue px-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  nerdsroom.org
                </button>
              )}
            </div>
          </div>
        </header>

        {authBannerError && (
          <div className="max-w-lg w-[92%] mx-auto mt-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl px-4 py-3 shadow-lg flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-black">Authentication Notice</div>
                <p className="mt-0.5">{authBannerError}</p>
              </div>
            </div>
            <button onClick={() => setAuthBannerError('')} className="p-1 rounded-lg hover:bg-red-100 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'admin-panel' ? (
          <div className="flex-1 -mt-8">
            <MasterAdminDashboard
              onAdminUnlocked={(adminUser) => setCurrentUser(adminUser)}
              onInspectEvent={(evt) => openEventView(evt)}
              onBrowseLiveSite={() => navigateToTab('events')}
              onLockSession={() => {
                setCurrentUser(null);
                clearPlatformState();
                navigateToTab('events');
              }}
              onDataMutated={() => fetchAllData()}
              onEventUpdated={handleEventUpdated}
            />
          </div>
        ) : (
          <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex flex-col justify-center">
            {urlParams.eventSlug && (
              <div className="mb-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-nerdDark text-xs flex items-start gap-2.5 shadow-sm">
                <Lock className="w-4 h-4 text-nerdBlue shrink-0 mt-0.5" />
                <div>
                  <span className="font-black">Event Invitation Ready:</span>{' '}
                  Sign in or create your Nerds Room account below to open{' '}
                  <code className="font-mono font-bold text-nerdBlue">/e/{urlParams.eventSlug}</code> and register.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Left Gate Intro */}
              <div className="lg:col-span-6 space-y-3 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-extrabold text-nerdBlue shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SIGN IN REQUIRED TO ACCESS PLATFORM</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-nerdDark leading-[1.1]">
                  Sign In to Enter{' '}
                  <span className="text-nerdBlue block sm:inline">Nerds Room League</span>
                </h1>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Access to events, hackathons, passes, matchmaking teams, project shipyard, and the organizer portal is restricted to signed-in Nerds Room accounts.
                </p>

                <div className="hidden sm:grid grid-cols-3 gap-2.5 pt-1 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Ticket className="w-4 h-4 text-nerdBlue mb-1" />
                    <div className="font-bold text-xs text-slate-900">QR Tickets</div>
                    <div className="text-[11px] text-slate-500">Verified event passes</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Layers className="w-4 h-4 text-nerdBlue mb-1" />
                    <div className="font-bold text-xs text-slate-900">Organizer Panel</div>
                    <div className="text-[11px] text-slate-500">Host &amp; edit rounds</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Rocket className="w-4 h-4 text-nerdBlue mb-1" />
                    <div className="font-bold text-xs text-slate-900">Shipyard</div>
                    <div className="text-[11px] text-slate-500">Teams &amp; submissions</div>
                  </div>
                </div>
              </div>

              {/* Right Sign-In Card */}
              <div className="lg:col-span-6 flex justify-center w-full">
                <AuthModal inline onSuccess={(user) => setCurrentUser(user)} />
              </div>
            </div>
          </main>
        )}

        <footer className="border-t border-slate-200 bg-white py-3.5 px-4 text-center text-xs text-slate-500 font-sans">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-bold">
            <span className="text-nerdDark font-black">nerds room<span className="text-nerdLime">.</span></span>
            <span>•</span>
            <span className="text-nerdBlue">league.nerdsroom.org</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-nerdLime selection:text-nerdDark">
      
      {/* Top Floating Pill Navbar */}
      <HackNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => navigateToTab(tab)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCreateEvent={handleOpenCreateEvent}
        onOpenCheckInDesk={handleOpenCheckInDesk}
        currentUser={currentUser}
        onLogout={handleLogout}
        myPassesCount={myPasses.length}
        onLockMasterSession={() => {
          const remaining = hackApi.getCurrentUser();
          setCurrentUser(remaining);
          if (!remaining) clearPlatformState();
          navigateToTab('events');
        }}
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
          <button onClick={() => setAuthBannerError('')} className="p-1 rounded-lg hover:bg-red-100 shrink-0">
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
          canEdit={canEditSelectedEvent}
          onEditClick={() => setEditingEvent(selectedEvent)}
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
            <UserDashboard
              currentUser={currentUser}
              initialMode={activeTab === 'organizer-portal' ? 'hosting' : 'attending'}
              refreshKey={dashboardRefreshKey}
              onViewPass={(rsvp, title) => {
                setViewingPass(rsvp);
                setViewingPassEventTitle(title);
              }}
              onBrowseEvents={() => navigateToTab('events')}
              onOpenCreateEvent={handleOpenCreateEvent}
              onOpenCheckInDesk={handleOpenCheckInDesk}
              onSelectEvent={(evt) => openEventView(evt)}
              onEventUpdated={handleEventUpdated}
            />
          )}

          {/* DEDICATED SEPARATE MASTER ADMIN PANEL (PROTECTED GATE) */}
          {activeTab === 'admin-panel' && (
            <MasterAdminDashboard
              onAdminUnlocked={(adminUser) => setCurrentUser(adminUser)}
              onInspectEvent={(evt) => openEventView(evt)}
              onBrowseLiveSite={() => navigateToTab('events')}
              onLockSession={() => {
                const remaining = hackApi.getCurrentUser();
                setCurrentUser(remaining);
                if (!remaining) clearPlatformState();
                navigateToTab('events');
              }}
              onDataMutated={() => fetchAllData()}
              onEventUpdated={handleEventUpdated}
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

              <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-10">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
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
                    onClick={handleOpenCreateEvent}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-sm transition-all self-start sm:self-auto"
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
                  <div className="py-14 px-5 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <Terminal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-800">
                      {events.length === 0 ? 'No live events published yet' : 'No events found matching your query'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      {events.length === 0
                        ? 'Launch your first hackathon or workshop in 60 seconds and customize rounds after launch.'
                        : 'Try resetting search filters or grepping a different keyword.'}
                    </p>
                    {events.length === 0 && (
                      <button
                        onClick={handleOpenCreateEvent}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4 text-nerdLime" />
                        <span>Host First Event</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
            <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-nerdBlue" />
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Hacker Team Matchmaking
                    </h2>
                  </div>
                  <p className="text-slate-600 text-xs font-sans">
                    Solo hackers looking for teammates in AI, Rust, Hardware, and UI. Connect directly or post your idea.
                  </p>
                </div>
                {events.length > 0 ? (
                  <button
                    onClick={() => setCreateTeamEvent(events[0])}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-nerdLime" />
                    <span>Post Team Listing</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCreateEvent}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-nerdLime" />
                    <span>Host First Event</span>
                  </button>
                )}
              </div>

              {allTeams.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No open team listings yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    Post your hackathon pitch and find co-builders in AI, Systems, Hardware, or Design.
                  </p>
                  {events.length > 0 ? (
                    <button
                      onClick={() => setCreateTeamEvent(events[0])}
                      className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                    >
                      + Post Team Listing
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateEvent}
                      className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                    >
                      + Host First Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allTeams.map((team) => (
                  <div key={team.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-bold text-base text-slate-900 truncate">{team.teamName}</h4>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
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
            <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-5 h-5 text-nerdBlue" />
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Project Shipyard & Demo Arena
                    </h2>
                  </div>
                  <p className="text-slate-600 text-xs font-sans">
                    Hacks shipped during Nerds Room events. Upvote your favorite builds!
                  </p>
                </div>
                {events.length > 0 ? (
                  <button
                    onClick={() => setSubmitProjectEvent(events[0])}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-nerdLime" />
                    <span>Submit Hack</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCreateEvent}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs hover:bg-blue-800 shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-nerdLime" />
                    <span>Host First Event</span>
                  </button>
                )}
              </div>

              {allProjects.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm">
                  <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No shipped projects yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    Submit your GitHub repository and live demo URL to get featured and collect community upvotes.
                  </p>
                  {events.length > 0 ? (
                    <button
                      onClick={() => setSubmitProjectEvent(events[0])}
                      className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                    >
                      + Submit Your Hack
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateEvent}
                      className="px-5 py-2.5 rounded-xl bg-nerdBlue text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
                    >
                      + Host First Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
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

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                        <div className="text-slate-500 truncate max-w-[60%]">
                          By: {proj.teamMembers.join(', ')}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
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
            <main className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12">
              <div className="flex items-center gap-2 mb-6">
                <Ticket className="w-5 h-5 text-nerdBlue" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  My Event Badges & QR Passes
                </h2>
              </div>

              {myPasses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No active passes yet</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">
                    RSVP to an upcoming event to instantly generate your verifiable ticket QR badge.
                  </p>
                  <button
                    onClick={() => navigateToTab('events')}
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
                        className="cursor-pointer bg-white border border-slate-200 hover:border-nerdBlue rounded-2xl p-4 sm:p-5 transition-all hover:shadow-lg shadow-sm"
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
                        <h4 className="text-base font-bold text-slate-900 mb-0.5 truncate">{p.hackerName}</h4>
                        <div className="text-xs text-nerdBlue font-bold mb-1 truncate">{evt?.title || 'Event Pass'}</div>
                        <div className="text-xs text-slate-500 mb-4 truncate">{p.hackerRole} • {p.teamName}</div>
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
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 font-sans">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mb-1 font-bold">
          <span className="text-nerdDark font-black">nerds room<span className="text-nerdLime">.</span></span>
          <span>•</span>
          <span className="text-nerdBlue">league.nerdsroom.org</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Powered by Nerds Room Infrastructure</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Open-Source Multi-Round Event Platform for Hackathons, Ideathons & Community Sprints.
        </p>
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

      {currentUser && createEventModalOpen && (
        <CreateEventModal
          onClose={() => setCreateEventModalOpen(false)}
          onEventCreated={(newEvent) => {
            setEvents(prev => [newEvent, ...prev]);
            setDashboardRefreshKey(k => k + 1);
            openEventView(newEvent);
            fetchAllData();
          }}
        />
      )}

      {currentUser && editingEvent && (
        <EditEventModal
          event={editingEvent}
          isMasterAdmin={hackApi.isMasterAdminAuthenticated()}
          onClose={() => setEditingEvent(null)}
          onEventUpdated={(updated) => {
            handleEventUpdated(updated);
            setEditingEvent(null);
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

      {currentUser && organizerModalOpen && (
        <OrganizerCheckInModal
          onClose={() => setOrganizerModalOpen(false)}
          onCheckInSuccess={() => {
            setMyPasses(hackApi.getMyPasses());
          }}
        />
      )}

    </div>
  );
};

export default HackHubPage;
