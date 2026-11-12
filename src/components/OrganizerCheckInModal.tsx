import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import { hackApi } from '../services/hackApi';
import { HackerRSVP } from '../types';

interface OrganizerCheckInModalProps {
  onClose: () => void;
  onCheckInSuccess?: (rsvp: HackerRSVP) => void;
}

export const OrganizerCheckInModal: React.FC<OrganizerCheckInModalProps> = ({ onClose, onCheckInSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    rsvp?: HackerRSVP;
    message: string;
    alreadyCheckedIn?: boolean;
  } | null>(null);

  const handleVerifyAndCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    const checkinRes = await hackApi.checkInAttendee(code.trim());
    setResult(checkinRes);
    setLoading(false);
    if (checkinRes.success && checkinRes.rsvp && onCheckInSuccess) {
      onCheckInSuccess(checkinRes.rsvp);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-5 h-5 text-nerdLime shrink-0" />
            <span className="text-sm font-black tracking-tight uppercase truncate">
              Organizer Entrance Check-in
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <p className="text-slate-600 text-xs">
            Enter or scan an attendee&apos;s verified ticket pass code (format <code className="text-nerdBlue font-bold bg-blue-50 px-1.5 py-0.5 rounded">NR-XXXXX</code>) to admit them.
          </p>

          {/* Form */}
          <form onSubmit={handleVerifyAndCheckIn} className="space-y-3">
            <div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="NR-XXXXX"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-nerdBlue rounded-2xl px-4 py-3 text-slate-900 text-base font-black font-mono tracking-widest placeholder-slate-400 uppercase focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Verifying Ticket on Database...' : 'Verify Ticket & Admit'}
            </button>
          </form>

          {/* Result Banner */}
          {result && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      {result.alreadyCheckedIn ? 'ALREADY CHECKED IN' : 'CHECK-IN CONFIRMED!'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>TICKET INVALID</span>
                  </>
                )}
              </div>

              <p className="text-xs mb-3">{result.message}</p>

              {result.rsvp && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-left space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{result.rsvp.hackerName}</span>
                    <span className="text-nerdBlue text-xs">{result.rsvp.hackerRole}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{result.rsvp.email}</div>
                  <div className="text-[10px] text-slate-400">
                    Team: {result.rsvp.teamName} • Pass: {result.rsvp.passCode}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
