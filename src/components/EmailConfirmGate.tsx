import React, { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { hackApi } from '../services/hackApi';
import { UserAccount } from '../types';

interface EmailConfirmGateProps {
  tokenHash: string;
  otpType: EmailOtpType;
  onVerified: (user?: UserAccount | null) => void;
  onBackToSignIn: () => void;
}

type ConfirmResult = {
  user?: UserAccount | null;
  type?: EmailOtpType;
  error?: string;
};

// Module-level promise cache ensures React StrictMode double-mounts never burn one-time tokens twice
const inFlightVerifications = new Map<string, Promise<ConfirmResult>>();

export const EmailConfirmGate: React.FC<EmailConfirmGateProps> = ({
  tokenHash,
  otpType,
  onVerified,
  onBackToSignIn,
}) => {
  const [status, setStatus] = useState<'verifying' | 'verified' | 'recovery' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<UserAccount | null | undefined>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    const key = `${otpType}:${tokenHash}`;
    let promise = inFlightVerifications.get(key);
    if (!promise) {
      promise = hackApi.verifyEmailTokenHash(tokenHash, otpType);
      inFlightVerifications.set(key, promise);
    }

    promise.then((res) => {
      if (!active) return;
      if (res.error) {
        setStatus('error');
        setErrorMsg(res.error);
        return;
      }
      setVerifiedUser(res.user);
      if (otpType === 'recovery') {
        setStatus('recovery');
      } else {
        setStatus('verified');
      }
    });

    return () => {
      active = false;
    };
  }, [tokenHash, otpType]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setErrorMsg('');
    const res = await hackApi.updateRecoveredPassword(newPassword);
    setSavingPassword(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    setVerifiedUser(res.user);
    setStatus('verified');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-nerdLime selection:text-nerdDark flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackToSignIn();
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-nerdBlue" />
            <span>Account Verification</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 mx-auto flex items-center justify-center mb-3">
              {status === 'verifying' && <Loader2 className="w-6 h-6 text-nerdLime animate-spin" />}
              {status === 'verified' && <CheckCircle2 className="w-6 h-6 text-nerdLime" />}
              {status === 'recovery' && <KeyRound className="w-6 h-6 text-nerdLime" />}
              {status === 'error' && <AlertCircle className="w-6 h-6 text-amber-300" />}
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">
              {status === 'verifying' && 'Verifying Your Account...'}
              {status === 'verified' && 'Email Verified Successfully!'}
              {status === 'recovery' && 'Set a New Password'}
              {status === 'error' && 'Verification Link Expired'}
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              {status === 'verifying' && 'Confirming your secure verification token on league.nerdsroom.org.'}
              {status === 'verified' && 'Your Nerds Room League account is now active.'}
              {status === 'recovery' && 'Choose a new password for your Nerds Room account.'}
              {status === 'error' && 'One-time confirmation links expire after 1 hour or one use.'}
            </p>
          </div>

          <div className="p-6 text-xs space-y-4">
            {status === 'verifying' && (
              <div className="py-4 text-center text-slate-500 font-medium">
                Please wait a moment while we activate your session...
              </div>
            )}

            {status === 'verified' && (
              <div className="space-y-4 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                  Welcome{verifiedUser?.name ? `, ${verifiedUser.name}` : ''}! Your email address is confirmed.
                </div>
                <button
                  type="button"
                  onClick={() => onVerified(verifiedUser)}
                  className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Enter Nerds Room League</span>
                  <ArrowRight className="w-4 h-4 text-nerdLime" />
                </button>
              </div>
            )}

            {status === 'recovery' && (
              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {savingPassword ? 'Updating Password...' : 'Save Password & Continue'}
                </button>
              </form>
            )}

            {status === 'error' && (
              <div className="space-y-4 text-center">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold leading-relaxed">
                  {errorMsg || 'This confirmation link has expired or was already used.'}
                </div>
                <button
                  type="button"
                  onClick={onBackToSignIn}
                  className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
