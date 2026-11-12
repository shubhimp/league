import React, { useState } from 'react';
import { X, Rocket, ArrowRight, Github, ExternalLink } from 'lucide-react';
import { HackProject } from '../types';
import { hackApi } from '../services/hackApi';

interface ProjectShipyardModalProps {
  eventSlug: string;
  onClose: () => void;
  onProjectSubmitted: (project: HackProject) => void;
}

export const ProjectShipyardModal: React.FC<ProjectShipyardModalProps> = ({
  eventSlug,
  onClose,
  onProjectSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('Rust, AI, Linux, TypeScript');
  const [teamMembersStr, setTeamMembersStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !repoUrl.trim()) return;

    setSubmitting(true);
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const teamMembers = teamMembersStr.split(',').map(m => m.trim()).filter(Boolean);

    const project = await hackApi.submitProject(eventSlug, {
      title: title.trim(),
      tagline: tagline.trim() || 'Built with passion at Nerds Room Hackathon',
      repoUrl: repoUrl.trim(),
      demoUrl: demoUrl.trim(),
      tags: tags.length ? tags : ['Hackathon'],
      teamMembers: teamMembers.length ? teamMembers : ['Anonymous Hacker'],
    });

    setSubmitting(false);
    onProjectSubmitted(project);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Rocket className="w-5 h-5 text-nerdLime shrink-0" />
            <span className="text-sm font-bold uppercase tracking-tight truncate">
              Ship Your Hack // Project Demo
            </span>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Project Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. KernelPulse Daemon"
              className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">One-Liner / Pitch</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. A real-time memory telemetry monitor running inside Linux LXC..."
              className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold flex items-center gap-1">
                <Github className="w-3.5 h-3.5 text-slate-700" />
                <span>GitHub Repository *</span>
              </label>
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5 text-nerdBlue" />
                <span>Live Demo URL</span>
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://...hackclub.app"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Tech Stack Tags (comma separated)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Rust, Python, WebAssembly, Next.js"
              className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Team Members Handles</label>
            <input
              type="text"
              value={teamMembersStr}
              onChange={(e) => setTeamMembersStr(e.target.value)}
              placeholder="adityasharma, elena-builds"
              className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
              <span>{submitting ? 'Submitting...' : 'Submit to Shipyard'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-nerdLime" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
