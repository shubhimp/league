import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Search, Layers, ArrowRight, Star, Sparkles } from 'lucide-react';
import { HackEvent } from '../types';

interface TerminalHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedType: string;
  setSelectedType: (t: string) => void;
  totalHackers: number;
  featuredEvent?: HackEvent | null;
  onSelectFeatured?: (event: HackEvent) => void;
}

export const TerminalHero: React.FC<TerminalHeroProps> = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  totalHackers,
  featuredEvent,
  onSelectFeatured,
}) => {
  const targetDate = new Date('2026-11-15T09:00:00Z').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 19, hours: 14, minutes: 22, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="relative overflow-hidden bg-white pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 border-b border-gray-100">
      
      {/* Exact Nerds Room bg-grid with radial mask */}
      <div 
        className="absolute inset-0 bg-grid pointer-events-none opacity-80"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
        
        {/* Exact Nerds Room Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-nerdLime/20 via-nerdLime/10 to-transparent border border-nerdLime/30 backdrop-blur-sm mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nerdLime opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-nerdLime"></span>
          </span>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-nerdBlue">
            NERDS ROOM LEAGUE • MULTI-ROUND HACK ARENA
          </span>
        </div>

        {/* 3-Line Iconic Main Heading */}
        <h1 className="font-black tracking-tight leading-[0.98] mb-6">
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-nerdBlue">
            BUILD. COMPETE.
          </span>
          <span
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-nerdLime via-nerdLime to-nerdBlue bg-clip-text text-transparent my-1"
            style={{
              textShadow: '2px 2px 0px rgba(0, 48, 143, 0.2)',
              filter: 'drop-shadow(0 0 10px rgba(155, 230, 0, 0.35))',
            }}
          >
            MULTI-ROUND HACKS
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-nerdLime">
            SHIP THE FUTURE<span className="text-nerdBlue">.</span>
          </span>
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-8">
          The premier platform for student developers and organizers. Multi-round progression, verified digital QR passes, instant team matchmaking, and live project shipyard.
        </p>

        {/* CTA Buttons with Main Site Signature Shadow */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
          <a
            href="#events-section"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border-2 border-nerdLime bg-gradient-to-r from-nerdLime to-nerdLime/90 text-nerdBlue text-sm sm:text-base font-black py-3 px-8 shadow-[0_6px_0_#00308F] hover:shadow-[0_4px_0_#00308F] hover:translate-y-0.5 active:translate-y-1 transition-all duration-200"
          >
            <span>EXPLORE EVENTS</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </a>

          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 border-nerdBlue bg-white text-nerdBlue font-bold text-xs shadow-sm">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="font-black text-slate-800">Next Flagship Starts in:</span>
            <span className="font-mono font-black text-nerdBlue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
        </div>

        {/* Stats Strip matching Nerds Room metric styling */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
          <div className="bg-[#EAF2FF] border border-blue-200/60 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-black text-nerdBlue mb-0.5">{totalHackers}+</div>
            <div className="text-xs font-bold text-slate-700">Hackers Registered</div>
          </div>

          <div className="bg-[#E8F5E9] border border-emerald-200/60 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-black text-emerald-700 mb-0.5">$25,000+</div>
            <div className="text-xs font-bold text-slate-700">Cash Bounties</div>
          </div>

          <div className="bg-[#FFF7E0] border border-amber-200/60 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-black text-amber-700 mb-0.5">3 Rounds</div>
            <div className="text-xs font-bold text-slate-700">Idea to Grand Finale</div>
          </div>

          <div className="bg-[#FCE4EC] border border-pink-200/60 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-black text-pink-700 mb-0.5">100% Free</div>
            <div className="text-xs font-bold text-slate-700">Student & Community Driven</div>
          </div>
        </div>

        {/* Featured Spotlight Event Card (If Featured on Site by Master Admin) */}
        {featuredEvent && (
          <div 
            onClick={() => onSelectFeatured && onSelectFeatured(featuredEvent)}
            className="cursor-pointer max-w-4xl mx-auto mb-8 bg-gradient-to-r from-blue-900 via-nerdBlue to-nerdDark text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-nerdLime flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:scale-[1.01] transition-transform text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-nerdLime text-nerdBlue flex items-center justify-center font-black shrink-0 shadow-md">
                <Star className="w-5 h-5 fill-nerdBlue text-nerdBlue" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-nerdLime/20 border border-nerdLime/40 text-nerdLime text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>MASTER ADMIN FEATURED SPOTLIGHT</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">{featuredEvent.title}</h3>
                <p className="text-xs text-blue-100 line-clamp-1">{featuredEvent.tagline}</p>
              </div>
            </div>

            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nerdLime text-nerdBlue font-black text-xs shrink-0 shadow-md hover:bg-lime-400">
              <span>View Event & Rounds</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div id="events-section" className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-nerdBlue/20 shadow-md">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-nerdBlue absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons, AI, Rust, tracks..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-sans text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-nerdBlue focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-sans text-xs font-black">
            {['all', 'hackathon', 'ideathon', 'workshop', 'meetup'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl uppercase tracking-wider text-[11px] transition-all whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-nerdBlue text-white shadow-[0_3px_0_#9BE600]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
