import React from 'react';
import { HackEvent } from '../types';
import { Calendar, MapPin, Users, Trophy, Layers, ArrowRight, Link as LinkIcon, Star, Lock, AlertCircle } from 'lucide-react';

interface EventCardProps {
  event: HackEvent;
  onSelect: (event: HackEvent) => void;
  onQuickRsvp: (event: HackEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, onQuickRsvp }) => {
  const startDate = new Date(event.startTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const totalPrizeAmount = event.prizes.length > 0 ? event.prizes[0].amount : null;
  const roundsCount = event.rounds?.length || 1;

  return (
    <div className={`group bg-white border-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_0_#00308F] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
      event.isFeatured ? 'border-amber-300 ring-2 ring-amber-300/30' : 'border-slate-200/90 hover:border-nerdBlue'
    }`}>
      
      {/* Cover Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={event.coverUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200 text-xs font-black text-nerdBlue uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${event.status === 'active' ? 'bg-nerdLime animate-pulse' : 'bg-slate-400'}`} />
            <span>{event.eventType}</span>
          </div>

          {event.isFeatured && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>FEATURED</span>
            </div>
          )}

          {event.approvalStatus === 'private' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-900/90 text-amber-200 text-[10px] font-bold">
              <Lock className="w-3 h-3" />
              <span>Private Link</span>
            </div>
          )}

          {event.approvalStatus === 'rejected' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600/95 text-white text-[10px] font-bold">
              <AlertCircle className="w-3 h-3" />
              <span>Rejected</span>
            </div>
          )}
        </div>

        {/* Rounds Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-nerdDark/90 backdrop-blur-md text-white text-[11px] font-black">
          <Layers className="w-3.5 h-3.5 text-nerdLime" />
          <span>{roundsCount} {roundsCount === 1 ? 'Round' : 'Rounds'}</span>
        </div>

        {/* Prize Bounty callout */}
        {totalPrizeAmount && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-nerdLime text-nerdBlue font-black text-xs shadow-md border border-nerdBlue/20">
            <Trophy className="w-3.5 h-3.5" />
            <span>{totalPrizeAmount} PRIZE</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-500 mb-2 font-mono">
            <span className="flex items-center gap-1 text-nerdBlue shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              {startDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          </div>

          <h3
            onClick={() => onSelect(event)}
            className="text-base sm:text-lg font-black text-nerdDark group-hover:text-nerdBlue transition-colors cursor-pointer tracking-tight mb-1.5 line-clamp-1"
          >
            {event.title}
          </h3>

          <p className="text-slate-600 text-xs line-clamp-2 mb-4 leading-relaxed font-sans">
            {event.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-nerdLime/20 text-nerdDark border border-nerdLime/40"
              >
                #{tag}
              </span>
            ))}
            {event.importantLinks?.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-nerdBlue border border-blue-200 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span>{event.importantLinks.length} links</span>
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold font-mono">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.rsvpCount || 0} Hackers</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              onClick={() => onSelect(event)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-nerdBlue hover:bg-slate-100 transition-colors"
            >
              Rounds &amp; Info
            </button>
            <button
              onClick={() => onQuickRsvp(event)}
              className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl bg-nerdBlue hover:bg-nerdLime text-white hover:text-nerdBlue font-black text-xs transition-all shadow-[0_3px_0_#001a4d] hover:shadow-none hover:translate-y-0.5"
            >
              <span>RSVP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
