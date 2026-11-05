import React, { useState } from 'react';
import { X, Users, ArrowRight } from 'lucide-react';
import { HackerTeam } from '../types';
import { hackApi } from '../services/hackApi';

interface TeamBoardModalProps {
  eventSlug: string;
  onClose: () => void;
  onTeamCreated: (team: HackerTeam) => void;
}

const AVAILABLE_ROLES = [
  'Rust / Systems Hacker',
  'AI / LLM Specialist',
  'Hardware / IoT Hacker',
  'Frontend & UI/UX Designer',
  'Backend & Database Architect',
  'Cybersecurity & Web3'
];

export const TeamBoardModal: React.FC<TeamBoardModalProps> = ({ eventSlug, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [pitch, setPitch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([AVAILABLE_ROLES[0]]);
  const [contactLink, setContactLink] = useState('https://discord.gg/nerdsroom');
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !pitch.trim()) return;

    setSubmitting(true);
    const newTeam = await hackApi.createTeam(eventSlug, {
      teamName: teamName.trim(),
      pitch: pitch.trim(),
      lookingForRoles: selectedRoles,
      contactLink: contactLink.trim()
    });
    setSubmitting(false);
    onTeamCreated(newTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 text-xs">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-nerdLime" />
            <span className="text-sm font-bold uppercase tracking-tight">
              Looking for Teammates // Post Listing
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Team or Project Codename *</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Autonomous Sentinel"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">The Pitch / Idea *</label>
            <textarea
              required
              rows={3}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="What are you building? e.g. An edge-computed mesh network using LoRa radios and local Llama-3..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-bold">Roles You Are Looking For</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] transition-all ${
                    selectedRoles.includes(role)
                      ? 'bg-blue-50 border-nerdBlue text-nerdBlue font-bold ring-2 ring-nerdBlue/15'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {selectedRoles.includes(role) && '✓ '}
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Contact Link (Discord / WhatsApp)</label>
            <input
              type="text"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
              placeholder="https://discord.gg/... or https://wa.me/..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold shadow-md disabled:opacity-50"
            >
              <span>{submitting ? 'Posting...' : 'Publish Listing'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-nerdLime" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
