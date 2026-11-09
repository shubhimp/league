import React, { useState } from 'react';
import { X, User, Lock, Mail, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { hackApi } from '../services/hackApi';
import { UserAccount, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const user = hackApi.login(email, role);
    onSuccess(user);
    onClose();
  };

  const handleQuickDemo = (demoRole: UserRole) => {
    const user = hackApi.switchRole(demoRole);
    onSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header with Nerds Room Gradient */}
        <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-black text-lg tracking-tight">
              <span>nerds room</span>
              <span className="text-nerdLime">league.</span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create your hacker profile in 10 seconds.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              mode === 'signin'
                ? 'bg-white text-nerdBlue border-b-2 border-nerdBlue shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-white text-nerdBlue border-b-2 border-nerdBlue shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Sharma"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">I am joining as:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  role === 'student'
                    ? 'border-nerdBlue bg-blue-50/70 text-nerdBlue font-bold ring-2 ring-nerdBlue/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-nerdBlue mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Student Hacker</div>
                  <div className="text-[10px] text-slate-500 font-normal">RSVP & submit hacks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  role === 'organizer'
                    ? 'border-nerdBlue bg-blue-50/70 text-nerdBlue font-bold ring-2 ring-nerdBlue/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-nerdBlue mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Organizer</div>
                  <div className="text-[10px] text-slate-500 font-normal">Create events & rounds</div>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-1.5"
          >
            <span>{mode === 'signin' ? 'Sign In' : 'Create My Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Google OAuth Button */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await hackApi.signInWithGoogle();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Shortcuts (Only Member and Organizer) */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2">⚡ Quick 1-Click Test Sign-In:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-colors truncate"
              >
                🎓 Student Hacker (Rohan)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('organizer')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-nerdBlue text-slate-700 text-xs font-bold transition-colors truncate"
              >
                🛠️ Organizer Host (Aditya)
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
