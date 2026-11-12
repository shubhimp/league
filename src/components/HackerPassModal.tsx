import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { HackerRSVP } from '../types';
import { X, Check, Copy, Download, ShieldCheck } from 'lucide-react';

interface HackerPassModalProps {
  rsvp: HackerRSVP;
  eventTitle?: string;
  onClose: () => void;
}

export const HackerPassModal: React.FC<HackerPassModalProps> = ({ rsvp, eventTitle, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rsvp.passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const qrValue = JSON.stringify({
    pass: rsvp.passCode,
    hacker: rsvp.hackerName,
    event: rsvp.eventId,
    role: rsvp.hackerRole
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        
        {/* Top Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-1.5 font-black text-sm tracking-tight min-w-0">
            <span className="truncate">NERDS ROOM LEAGUE PASS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Card Container */}
        <div className="p-4 sm:p-6 text-center font-sans flex-1 overflow-y-auto">
          
          {/* Lanyard Hole visual */}
          <div className="w-14 h-2.5 bg-slate-200 rounded-full mx-auto mb-4" />

          {/* Verification Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{rsvp.checkedIn ? 'CHECKED IN' : 'CONFIRMED ATTENDEE'}</span>
          </div>

          {/* Hacker Avatar */}
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden border-2 border-nerdBlue shadow-md bg-slate-50">
            <img
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(rsvp.hackerName)}`}
              alt={rsvp.hackerName}
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-0.5">
            {rsvp.hackerName}
          </h2>
          <div className="text-xs text-slate-500 mb-2">
            @{rsvp.githubHandle || rsvp.email.split('@')[0]}
            {rsvp.discordTag && <span className="ml-1 text-slate-400">• {rsvp.discordTag}</span>}
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-nerdBlue text-xs font-bold mb-3 border border-blue-100">
            {rsvp.hackerRole}
          </div>

          {eventTitle && (
            <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl mb-4 truncate">
              {eventTitle}
            </div>
          )}

          {/* QR Code */}
          <div className="bg-white p-3 rounded-2xl inline-block shadow-md mb-4 border border-slate-200">
            <QRCodeSVG
              value={qrValue}
              size={135}
              level="M"
              fgColor="#001A4D"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Code box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-w-xs mx-auto mb-4 flex items-center justify-between">
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Pass Code</div>
              <div className="text-sm font-black text-nerdBlue tracking-wider">{rsvp.passCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-nerdBlue" />
              <span>Save Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
