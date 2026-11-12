import React, { useState, useEffect } from 'react';
import { 
  Terminal, Users, Rocket, Ticket, Plus, LogOut, LogIn, Shield, 
  Crown, ChevronDown, Check, UserCheck, Layers, Sparkles, LayoutDashboard, Lock 
} from 'lucide-react';
import { hackApi } from '../services/hackApi';
import { InfrastructureHealth, UserAccount, UserRole } from '../types';

export type NavTab = 'events' | 'teams' | 'shipyard' | 'passes' | 'dashboard' | 'admin-panel' | 'student-dashboard' | 'organizer-portal';

interface HackNavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenCloudStatus: () => void;
  onOpenAuth: () => void;
  onOpenCreateEvent: () => void;
  onOpenCheckInDesk: () => void;
  currentUser: UserAccount | null;
  onLogout: () => void;
  myPassesCount: number;
  onSwitchUser?: (user: UserAccount) => void;
  onLockMasterSession?: () => void;
}

export const HackNavbar: React.FC<HackNavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCloudStatus,
  onOpenAuth,
  onOpenCreateEvent,
  onOpenCheckInDesk,
  currentUser,
  onLogout,
  myPassesCount,
  onSwitchUser,
  onLockMasterSession,
}) => {
  const [clusterHealth, setClusterHealth] = useState<InfrastructureHealth>({ 
    status: 'checking', 
    platform: 'Nerds Room Cloud' 
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const health = await hackApi.checkClusterHealth();
      if (mounted) setClusterHealth(health);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isMasterAdminActive = hackApi.isMasterAdminAuthenticated();
  const isDashboardActive = activeTab === 'dashboard' || activeTab === 'student-dashboard' || activeTab === 'organizer-portal';

  const handleLockMaster = () => {
    hackApi.setMasterAdminAuthenticated(false);
    setRoleDropdownOpen(false);
    if (onLockMasterSession) onLockMasterSession();
    setActiveTab('events');
  };

  return (
    <>
      {/* Floating Pill Nav Bar (Exact Nerds Room Main Site Signature) */}
      <nav className="fixed top-0 left-0 right-0 z-40 w-full px-3 sm:px-4 pt-3 sm:pt-4 pointer-events-none">
        <div className="relative max-w-[96vw] xl:max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex justify-between items-center gap-2 sm:gap-4 md:gap-6 bg-white/80 backdrop-blur-xl border border-white/70 shadow-lg rounded-full pointer-events-auto transition-all duration-300">
          
          {/* Logo & League Pill */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}
            className="flex items-center gap-2 group shrink-0"
          >
            <img
              src="/logo.png"
              alt="Nerds Room Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-black text-base sm:text-xl tracking-tight text-nerdBlue whitespace-nowrap">
              nerds room<span className="text-nerdLime">.</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-nerdLime text-nerdBlue text-[10px] font-black uppercase tracking-wider shadow-sm">
              LEAGUE
            </span>
          </a>

          {/* Center Navigation Links (Members-Only Platform Links) */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-3 xl:gap-5 font-medium text-nerdDark text-[13px] xl:text-[14px]">
              <button
                onClick={() => setActiveTab('events')}
                className={`hover:text-nerdBlue transition-colors font-bold whitespace-nowrap ${
                  activeTab === 'events' ? 'text-nerdBlue border-b-2 border-nerdBlue pb-0.5' : 'text-slate-700'
                }`}
              >
                Events &amp; Rounds
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`hover:text-nerdBlue transition-colors font-bold flex items-center gap-1.5 whitespace-nowrap ${
                  isDashboardActive ? 'text-nerdBlue border-b-2 border-nerdBlue pb-0.5' : 'text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-nerdBlue" />
                <span>My Dashboard</span>
                <span className="w-2 h-2 rounded-full bg-nerdLime animate-pulse" />
              </button>

              {/* ONLY VISIBLE IF ACTIVELY AUTHENTICATED AS MASTER ADMIN */}
              {isMasterAdminActive && (
                <button
                  onClick={() => setActiveTab('admin-panel')}
                  className={`hover:text-purple-900 transition-colors font-bold flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 shadow-sm ${
                    activeTab === 'admin-panel' ? 'ring-2 ring-purple-400 font-black' : ''
                  }`}
                  title="Private Core Team Console"
                >
                  <Crown className="w-3.5 h-3.5 text-purple-700" />
                  <span>👑 Master Control</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('teams')}
                className={`hover:text-nerdBlue transition-colors font-bold whitespace-nowrap ${
                  activeTab === 'teams' ? 'text-nerdBlue border-b-2 border-nerdBlue pb-0.5' : 'text-slate-700'
                }`}
              >
                Find Team
              </button>

              <button
                onClick={() => setActiveTab('shipyard')}
                className={`hover:text-nerdBlue transition-colors font-bold whitespace-nowrap ${
                  activeTab === 'shipyard' ? 'text-nerdBlue border-b-2 border-nerdBlue pb-0.5' : 'text-slate-700'
                }`}
              >
                Shipyard
              </button>

              <button
                onClick={() => setActiveTab('passes')}
                className={`hover:text-nerdBlue transition-colors font-bold flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'passes' ? 'text-nerdBlue border-b-2 border-nerdBlue pb-0.5' : 'text-slate-700'
                }`}
              >
                <span>My Passes</span>
                {myPassesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-nerdLime text-nerdBlue text-[10px] font-black flex items-center justify-center">
                    {myPassesCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Host Event & Check-In Desk (Logged-in window only) */}
            {currentUser && (
              <>
                <button
                  onClick={onOpenCreateEvent}
                  className="hidden sm:flex items-center gap-1.5 bg-nerdBlue text-white font-bold px-3 sm:px-4 py-1.5 rounded-full border border-transparent hover:bg-nerdLime hover:text-nerdBlue transition-all shadow-md text-xs tracking-wide whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Host Event</span>
                </button>

                <button
                  onClick={onOpenCheckInDesk}
                  className="hidden sm:inline-flex items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-200 hover:border-nerdBlue text-slate-700 hover:text-nerdBlue text-xs font-bold transition-all bg-white/80"
                  title="Scanner Check-In Desk"
                >
                  <Shield className="w-3.5 h-3.5 text-nerdBlue inline sm:mr-1" />
                  <span className="hidden md:inline">Desk</span>
                </button>
              </>
            )}

            {/* Profile Menu */}
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full border border-slate-200 hover:border-nerdBlue bg-white shadow-sm transition-all"
                  title="View Profile & Settings"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-nerdBlue/30 bg-slate-100"
                  />
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full hidden sm:inline bg-blue-100 text-nerdBlue">
                    {isMasterAdminActive ? '👑 Core Admin' : '👤 Member'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-nerdBlue text-white hover:bg-blue-800 font-bold text-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Profile Dropdown */}
              {roleDropdownOpen && currentUser && (
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[250] text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 font-bold transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-nerdBlue" />
                    <span>Open My Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('organizer-portal');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-blue-50 text-nerdBlue font-bold transition-colors"
                  >
                    <Layers className="w-4 h-4 text-nerdBlue" />
                    <span>Organizer Panel</span>
                  </button>

                  {/* Active Master Session Controls (Only when already authenticated) */}
                  {isMasterAdminActive && (
                    <div className="my-1 p-2 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                      <div className="text-[10px] font-black uppercase flex items-center justify-between">
                        <span>Core Admin Session</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('admin-panel');
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full text-left font-bold text-[11px] text-purple-700 hover:underline"
                      >
                        → Open Master Control
                      </button>
                      <button
                        onClick={handleLockMaster}
                        className="w-full text-left font-bold text-[10px] text-red-600 hover:underline pt-1 border-t border-purple-200"
                      >
                        Lock Master Session
                      </button>
                    </div>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1 space-y-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-left font-bold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>

                    {/* Subtle Master Access for Core Team */}
                    {!isMasterAdminActive && (
                      <button
                        onClick={() => {
                          setActiveTab('admin-panel');
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full text-[10px] text-slate-400 hover:text-nerdBlue text-right pt-1 font-mono transition-colors"
                        title="Core Team Gate"
                      >
                        🔐 Core Team Gate
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Status Indicator */}
            <button
              onClick={onOpenCloudStatus}
              className="w-2.5 h-2.5 rounded-full bg-nerdLime ring-2 ring-nerdBlue/30 hover:scale-125 transition-transform"
              title="Supabase + Cloudinary + Vercel Cloud Status"
            />

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-nerdBlue p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[62px] sm:top-[72px] bg-white border-b-2 border-nerdBlue shadow-2xl p-4 sm:p-6 max-h-[calc(100dvh-4.5rem)] overflow-y-auto lg:hidden z-[200] space-y-2.5 font-bold text-nerdBlue text-xs sm:text-sm">
          {currentUser ? (
            <>
              <button
                onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center justify-between"
              >
                <span>EVENTS &amp; ROUNDS</span> <span className="text-nerdLime">-&gt;</span>
              </button>

              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl bg-blue-50 text-nerdBlue flex items-center justify-between"
              >
                <span>MY DASHBOARD</span> <span className="text-nerdBlue">-&gt;</span>
              </button>

              <button
                onClick={() => { setActiveTab('organizer-portal'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl bg-blue-50/60 text-nerdBlue flex items-center justify-between"
              >
                <span>ORGANIZER PANEL</span> <span className="text-nerdBlue">-&gt;</span>
              </button>

              {isMasterAdminActive && (
                <button
                  onClick={() => { setActiveTab('admin-panel'); setMobileMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-between"
                >
                  <span>👑 MASTER CONTROL</span> <span className="text-purple-700">-&gt;</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('teams'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center justify-between"
              >
                <span>FIND TEAM</span> <span className="text-nerdLime">-&gt;</span>
              </button>

              <button
                onClick={() => { setActiveTab('shipyard'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center justify-between"
              >
                <span>SHIPYARD DEMOS</span> <span className="text-nerdLime">-&gt;</span>
              </button>

              <button
                onClick={() => { setActiveTab('passes'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center justify-between"
              >
                <span>MY PASSES ({myPassesCount})</span> <span className="text-nerdLime">-&gt;</span>
              </button>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onOpenCheckInDesk(); setMobileMenuOpen(false); }}
                  className="text-center py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:border-nerdBlue font-bold text-xs"
                >
                  CHECK-IN DESK
                </button>
                <button
                  onClick={() => { onOpenCreateEvent(); setMobileMenuOpen(false); }}
                  className="text-center py-2.5 px-3 rounded-xl bg-nerdBlue text-white hover:bg-nerdLime hover:text-nerdBlue font-black text-xs"
                >
                  + HOST EVENT
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full text-center py-3 rounded-xl bg-nerdBlue text-white hover:bg-nerdLime hover:text-nerdBlue font-black"
            >
              SIGN IN / CREATE ACCOUNT
            </button>
          )}
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden bg-black/30" onClick={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
};
