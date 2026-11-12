import React, { useState } from 'react';
import { HackEvent, HackerRSVP } from '../types';
import { hackApi } from '../services/hackApi';
import { X, ArrowRight, AlertCircle, Sparkles, User, Mail, Shield } from 'lucide-react';

interface HackerRSVPModalProps {
  event: HackEvent;
  onClose: () => void;
  onRsvpSuccess: (rsvp: HackerRSVP) => void;
}

const ROLES = [
  'AI & Machine Learning',
  'Systems & Low-level (C/Rust)',
  'Fullstack Web & APIs',
  'Hardware & Physical Computing',
  'UI/UX & Product Design',
  'Hacker Founder / Solo Ship'
];

export const HackerRSVPModal: React.FC<HackerRSVPModalProps> = ({ event, onClose, onRsvpSuccess }) => {
  const currentUser = hackApi.getCurrentUser();
  const [hackerName, setHackerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [githubHandle, setGithubHandle] = useState(currentUser?.githubHandle || '');
  const [discordTag, setDiscordTag] = useState('');
  const [hackerRole, setHackerRole] = useState(ROLES[0]);
  const [teamOption, setTeamOption] = useState<'solo' | 'team'>('solo');
  const [teamName, setTeamName] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('Standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackerName.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await hackApi.rsvpEvent(event.slug, {
        hackerName: hackerName.trim(),
        email: email.trim(),
        githubHandle: githubHandle.trim().replace(/^@/, ''),
        discordTag: discordTag.trim(),
        hackerRole,
        teamName: teamOption === 'team' && teamName.trim() ? teamName.trim() : 'Solo Hacker',
        dietaryNeeds,
      });

      onRsvpSuccess(res.rsvp);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-nerdLime block">
              Event Registration
            </span>
            <h3 className="font-black text-base sm:text-lg tracking-tight text-white truncate">
              {event.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Full Name *</label>
              <input
                type="text"
                required
                value={hackerName}
                onChange={(e) => setHackerName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* GitHub & Discord */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">GitHub Username</label>
              <input
                type="text"
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
                placeholder="octocat"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Discord or WhatsApp</label>
              <input
                type="text"
                value={discordTag}
                onChange={(e) => setDiscordTag(e.target.value)}
                placeholder="username#1337 or phone"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-slate-700 mb-1.5 font-bold">Your Primary Track / Skill</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setHackerRole(role)}
                  className={`px-3 py-2 rounded-xl text-left text-[11px] font-bold border transition-all truncate ${
                    hackerRole === role
                      ? 'bg-blue-50 border-nerdBlue text-nerdBlue ring-2 ring-nerdBlue/15'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {hackerRole === role && '✓ '}
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Team Preference */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Team Status</label>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name="teamOption"
                  checked={teamOption === 'solo'}
                  onChange={() => setTeamOption('solo')}
                  className="accent-nerdBlue"
                />
                <span>Solo (Match me with a team)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name="teamOption"
                  checked={teamOption === 'team'}
                  onChange={() => setTeamOption('team')}
                  className="accent-nerdBlue"
                />
                <span>Forming a Team</span>
              </label>
            </div>
            {teamOption === 'team' && (
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Name (e.g. CyberPunks)"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-nerdBlue"
              />
            )}
          </div>

          {/* Swag size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Dietary Food Option</label>
              <select
                value={dietaryNeeds}
                onChange={(e) => setDietaryNeeds(e.target.value)}
                className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-nerdBlue"
              >
                <option value="Standard">Standard / Omnivore</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Halal">Halal</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">T-Shirt Swag Size</label>
              <select className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-nerdBlue font-bold">
                <option>M (Standard)</option>
                <option>S</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <span className="text-[11px] text-slate-400 text-center sm:text-left">
              ⚡ Free entry pass minted on submit
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all"
            >
              <span>{submitting ? 'Generating...' : 'Complete RSVP'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-nerdLime" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
