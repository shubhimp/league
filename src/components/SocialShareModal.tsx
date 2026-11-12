import React, { useState, useRef } from 'react';
import { X, Share2, Copy, Check, Twitter, MessageCircle, Linkedin, Send, Download, Sparkles, Calendar, MapPin, ShieldCheck, ExternalLink } from 'lucide-react';
import { HackEvent } from '../types';

interface SocialShareModalProps {
  event: HackEvent;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewCardRef = useRef<HTMLDivElement>(null);

  // Generate shareable Lu.ma-style clean event URL (routed through Vercel OG proxy for crawlers)
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.slug}${event.approvalStatus === 'private' ? `?secret=${event.privateAccessCode}` : ''}`
    : `https://league.nerdsroom.org/e/${event.slug}`;

  const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const monthShort = new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = new Date(event.startTime).getDate();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Social Share Handlers
  const shareTwitter = () => {
    const text = encodeURIComponent(`🚀 Excited to participate in ${event.title} hosted by @nerdsroom! 36 hours of hacking and building.\n\nRSVP & grab your digital hacker pass here:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🔥 Hey! Check out ${event.title} on Nerds Room League!\n\n📅 ${eventDate}\n📍 ${event.location}\n🏆 Prize Pool: ${event.prizes?.[0]?.amount || '$5,000+'}\n\nRegister & get your digital QR pass here:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`🚀 Join ${event.title} on Nerds Room League!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  // Generate and Download Canvas Image (Lu.ma style pre-image)
  const downloadLumaCard = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark Tech Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
      bgGrad.addColorStop(0, '#060B18');
      bgGrad.addColorStop(0.5, '#0B1530');
      bgGrad.addColorStop(1, '#050811');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Glow Accents
      const glow = ctx.createRadialGradient(900, 150, 10, 900, 150, 450);
      glow.addColorStop(0, 'rgba(30, 90, 255, 0.35)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1200, 630);

      // Brand Top Bar
      ctx.fillStyle = '#C8FF00'; // NerdLime
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('⚡ NERDS ROOM LEAGUE', 80, 80);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px sans-serif';
      ctx.fillText('OFFICIAL HACKATHON PASS & INVITATION', 80, 115);

      // Event Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px sans-serif';
      const words = event.title.split(' ');
      let line = '';
      let y = 200;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 700 && n > 0) {
          ctx.fillText(line, 80, y);
          line = words[n] + ' ';
          y += 65;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 80, y);

      // Tagline
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '24px sans-serif';
      ctx.fillText(event.tagline || '36 Hours of intense building, shipping, and bounties.', 80, y + 55);

      // Info Pills
      const pillY = 460;
      // Date Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(80, pillY, 320, 60, 16);
      ctx.fill();

      ctx.fillStyle = '#C8FF00';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`📅 ${eventDate}`, 105, pillY + 38);

      // Venue Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(420, pillY, 360, 60, 16);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`📍 ${event.location.substring(0, 26)}`, 445, pillY + 38);

      // Organizer & Verified Badge
      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Hosted by: ${event.organizerName || 'Nerds Room Lead'}  •  ✓ Verified Event`, 80, 570);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${event.slug}-luma-card.png`;
      a.click();
    } catch (e) {
      console.error('Failed to generate image:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92dvh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-nerdLime shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">Share &amp; Lu.ma Social Card</h3>
              <p className="text-xs text-blue-100 truncate">Direct 1-click sharing to all social channels</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Lu.ma-style Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lu.ma-Style Social Preview</span>
              <button
                onClick={downloadLumaCard}
                disabled={downloading}
                className="flex items-center gap-1 text-nerdBlue hover:text-blue-800 transition-colors capitalize font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Rendering...' : 'Download Card PNG'}</span>
              </button>
            </div>

            <div
              ref={previewCardRef}
              className="relative rounded-2xl overflow-hidden bg-slate-900 text-white border border-slate-800 shadow-xl group"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={event.coverUrl}
                  alt={event.title}
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                
                {/* Floating Date Badge */}
                <div className="absolute top-3 left-3 bg-white text-slate-900 rounded-xl p-2 text-center shadow-lg min-w-[50px] border border-slate-100">
                  <div className="text-[10px] font-black uppercase text-rose-600">{monthShort}</div>
                  <div className="text-lg font-black leading-none">{dayNum}</div>
                </div>

                {/* Event Type & Status Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-nerdLime text-nerdDark font-black text-[10px] uppercase tracking-wider shadow">
                    {event.eventType}
                  </span>
                  {event.approvalStatus === 'private' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                      Private Link
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-lg font-black text-white leading-tight line-clamp-1">
                  {event.title}
                </h4>
                <p className="text-slate-300 text-xs line-clamp-1">
                  {event.tagline || 'A flagship event hosted on Nerds Room League.'}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-nerdLime shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-nerdBlue" />
                    <span>Hosted by <strong>{event.organizerName || 'Nerds Room'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Social Sharing Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Share Directly to Socials
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              <button
                type="button"
                onClick={shareTwitter}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
              >
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span>Post on 𝕏</span>
              </button>

              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={shareLinkedIn}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={shareTelegram}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1C88BD] text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>

            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-slate-700 font-bold text-xs">Direct Shareable URL</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-nerdBlue hover:bg-blue-800 text-white shadow-sm'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            {copied && (
              <p className="text-[11px] font-bold text-emerald-600 animate-fade-in">
                ✓ Event link copied to clipboard! Ready to paste anywhere.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
