import React, { useState, useRef } from 'react';
import {
  X, Plus, Trash2, Layers, Link as LinkIcon, Trophy, Calendar,
  Image as ImageIcon, Upload, Globe, Check, AlertCircle, Save
} from 'lucide-react';
import {
  HackEvent, EventRound, ImportantLink, PrizeBounty,
  EventType, EventApprovalStatus
} from '../types';
import { hackApi } from '../services/hackApi';

interface EditEventModalProps {
  event: HackEvent;
  isMasterAdmin?: boolean;
  initialTab?: 'basics' | 'rounds' | 'schedule' | 'extras';
  onClose: () => void;
  onEventUpdated: (updated: HackEvent) => void;
}

const PRESET_BANNERS = [
  { label: 'Matrix Dark', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cyber Circuit', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'AI Terminal', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Builder Arena', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
];

function toDateInput(iso: string, fallbackOffsetDays = 0): string {
  const dt = iso ? new Date(iso) : new Date(Date.now() + fallbackOffsetDays * 86400000);
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().split('T')[0];
  return dt.toISOString().split('T')[0];
}

function toTimeInput(iso: string, fallback = '09:00'): string {
  const dt = iso ? new Date(iso) : null;
  if (!dt || Number.isNaN(dt.getTime())) return fallback;
  return dt.toISOString().slice(11, 16);
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  isMasterAdmin = false,
  initialTab = 'basics',
  onClose,
  onEventUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sectionTab, setSectionTab] = useState<'basics' | 'rounds' | 'schedule' | 'extras'>(initialTab);

  // Basics & Slug
  const [slug, setSlug] = useState(event.slug);
  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.eventType);
  const [tagline, setTagline] = useState(event.tagline);
  const [description, setDescription] = useState(event.description);
  const [venueType, setVenueType] = useState<'hybrid' | 'in-person' | 'virtual'>(event.venueType);
  const [location, setLocation] = useState(event.location);
  const [organizerName, setOrganizerName] = useState(event.organizerName);
  const [organizerOrg, setOrganizerOrg] = useState(event.organizerOrg || 'Nerds Room Community');
  const [tagsStr, setTagsStr] = useState((event.tags || []).join(', '));
  const [approvalStatus, setApprovalStatus] = useState<EventApprovalStatus>(event.approvalStatus);
  const [isFeatured, setIsFeatured] = useState<boolean>(event.isFeatured);

  // Schedule & Banner
  const [startDate, setStartDate] = useState(() => toDateInput(event.startTime));
  const [startTimeClock, setStartTimeClock] = useState(() => toTimeInput(event.startTime, '09:00'));
  const [endDate, setEndDate] = useState(() => toDateInput(event.endTime, 2));
  const [endTimeClock, setEndTimeClock] = useState(() => toTimeInput(event.endTime, '18:00'));
  const [coverUrl, setCoverUrl] = useState(event.coverUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Rounds (fully editable titles, descriptions, dates, status, deliverables)
  const [rounds, setRounds] = useState<EventRound[]>(
    event.rounds && event.rounds.length > 0
      ? event.rounds.map((r, i) => ({
          ...r,
          id: r.id || `rnd_${i}_${Date.now()}`,
          startDate: toDateInput(r.startDate || event.startTime),
          endDate: toDateInput(r.endDate || event.endTime, 2),
        }))
      : [
          {
            id: 'rnd_' + Date.now(),
            roundNumber: 1,
            title: 'Round 1: Main Submission & Demos',
            startDate: toDateInput(event.startTime),
            endDate: toDateInput(event.endTime, 2),
            description: 'Build and submit your project before the event deadline.',
            status: 'active',
            submissionType: 'github',
          },
        ]
  );

  // Prizes & Important Links
  const [prizes, setPrizes] = useState<PrizeBounty[]>(event.prizes || []);
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>(event.importantLinks || []);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cleanSlugPreview = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setUploadError('');
    const res = await hackApi.uploadCoverToCloudinary(file);
    setUploadingCover(false);
    if (res.url) {
      setCoverUrl(res.url);
    } else if (res.error) {
      setUploadError(res.error);
    }
  };

  const addRound = () => {
    const nextNum = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        id: `rnd_${Date.now()}_${nextNum}`,
        roundNumber: nextNum,
        title: `Round ${nextNum}: Next Stage`,
        startDate,
        endDate,
        description: 'Submit your deliverable for this stage.',
        status: 'upcoming',
        submissionType: 'github',
      },
    ]);
  };

  const removeRound = (id: string) => {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const updateRoundField = <K extends keyof EventRound>(index: number, field: K, value: EventRound[K]) => {
    setRounds((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addPrize = () => {
    setPrizes([
      ...prizes,
      { title: 'Winner Prize', amount: '$1,000', description: 'Top overall build' },
    ]);
  };

  const removePrize = (idx: number) => {
    setPrizes(prizes.filter((_, i) => i !== idx));
  };

  const addLink = () => {
    setImportantLinks([
      ...importantLinks,
      { id: `lnk_${Date.now()}`, title: 'Community Discord', url: 'https://discord.gg/nerdsroom', type: 'discord' },
    ]);
  };

  const removeLink = (id: string) => {
    setImportantLinks(importantLinks.filter((l) => l.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setErrorMsg('');
    if (cleanSlugPreview.length < 3) {
      setSectionTab('basics');
      setErrorMsg('Custom URL slug must be at least 3 characters.');
      return;
    }

    const startTimeIso = new Date(`${startDate}T${startTimeClock || '09:00'}:00`).toISOString();
    const endTimeIso = new Date(`${endDate}T${endTimeClock || '18:00'}:00`).toISOString();
    if (new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
      setSectionTab('schedule');
      setErrorMsg('End date/time must be after Start date/time.');
      return;
    }

    setSaving(true);
    const res = await hackApi.updateEvent(event.id, {
      slug: cleanSlugPreview,
      title: title.trim(),
      eventType,
      tagline: tagline.trim() || 'Build, ship, and compete at Nerds Room League.',
      description: description.trim(),
      venueType,
      location: location.trim() || 'Online / Discord',
      organizerName: organizerName.trim() || event.organizerName,
      organizerOrg: organizerOrg.trim() || 'Nerds Room Community',
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
      startTime: startTimeIso,
      endTime: endTimeIso,
      coverUrl: coverUrl.trim() || event.coverUrl,
      rounds: rounds.map((r, i) => ({
        ...r,
        roundNumber: i + 1,
        title: r.title.trim() || `Round ${i + 1}`,
      })),
      prizes: prizes.filter((p) => p.title.trim() || p.amount.trim()),
      importantLinks: importantLinks.filter((l) => l.title.trim() && l.url.trim()),
      approvalStatus,
      isFeatured: isMasterAdmin ? isFeatured : event.isFeatured,
    });
    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    if (res.event) {
      onEventUpdated(res.event);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <span className="truncate">Manage & Customize Event</span>
              {isMasterAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/40 border border-purple-300/60 text-[10px] uppercase shrink-0">
                  Admin Mode
                </span>
              )}
            </div>
            <p className="text-xs text-blue-100 mt-0.5 truncate">{event.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setSectionTab('basics')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sectionTab === 'basics' ? 'bg-nerdBlue text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Details & URL Slug</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('rounds')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sectionTab === 'rounds' ? 'bg-nerdBlue text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-nerdLime" />
            <span>Rounds ({rounds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('schedule')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sectionTab === 'schedule' ? 'bg-nerdBlue text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Banner & Dates</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('extras')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sectionTab === 'extras' ? 'bg-nerdBlue text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Prizes & Links</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs font-sans">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: DETAILS & CUSTOM URL SLUG */}
          {sectionTab === 'basics' && (
            <div className="space-y-4">
              {/* Custom Slug Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block text-nerdDark font-black text-xs">
                  Custom Event URL Slug
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-2 focus-within:border-nerdBlue">
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    league.nerdsroom.org/e/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-custom-event-slug"
                    className="w-full min-w-0 font-mono font-bold text-sm sm:text-xs text-nerdBlue focus:outline-none bg-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Live URL: <code className="font-mono text-nerdBlue">/e/{cleanSlugPreview || '...'}</code> (letters, numbers, hyphens only)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="ideathon">Ideathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="meetup">Meetup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Short Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Format</label>
                  <select
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value as 'hybrid' | 'in-person' | 'virtual')}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="in-person">In-Person</option>
                    <option value="virtual">Virtual / Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Venue / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organizer Name</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organization / Chapter</label>
                  <input
                    type="text"
                    value={organizerOrg}
                    onChange={(e) => setOrganizerOrg(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tech Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="AI Agents, Rust, Web3"
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Visibility & Admin Spotlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Visibility</label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as EventApprovalStatus)}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="approved">Public (Live on Site)</option>
                    <option value="private">Private (Secret Link Only)</option>
                    {isMasterAdmin && <option value="rejected">Rejected (Hidden)</option>}
                  </select>
                </div>

                {isMasterAdmin && (
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-amber-50 border border-amber-200 w-full">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="accent-nerdBlue w-4 h-4"
                      />
                      <span className="font-bold text-amber-900 text-xs">
                        Feature Spotlight on Hero
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDITABLE ROUNDS & STAGES */}
          {sectionTab === 'rounds' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Rounds & Progression</h3>
                  <p className="text-[11px] text-slate-500">
                    Customize round titles, deadlines, deliverables, or add new rounds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRound}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-nerdBlue hover:bg-blue-100 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Round</span>
                </button>
              </div>

              <div className="space-y-3">
                {rounds.map((round, idx) => (
                  <div key={round.id} className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-black text-nerdBlue text-xs">
                        <span className="w-5 h-5 rounded-full bg-nerdBlue text-white text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>Round {idx + 1}</span>
                      </span>
                      {rounds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRound(round.id)}
                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Round Title *</label>
                      <input
                        type="text"
                        required
                        value={round.title}
                        onChange={(e) => updateRoundField(idx, 'title', e.target.value)}
                        placeholder={`Round ${idx + 1} Title`}
                        className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={round.description}
                        onChange={(e) => updateRoundField(idx, 'description', e.target.value)}
                        placeholder="What should participants submit in this round?"
                        className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Start Date</label>
                        <input
                          type="date"
                          value={round.startDate}
                          onChange={(e) => updateRoundField(idx, 'startDate', e.target.value)}
                          className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Deadline</label>
                        <input
                          type="date"
                          value={round.endDate}
                          onChange={(e) => updateRoundField(idx, 'endDate', e.target.value)}
                          className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Stage Status</label>
                        <select
                          value={round.status}
                          onChange={(e) => updateRoundField(idx, 'status', e.target.value as EventRound['status'])}
                          className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs font-bold"
                        >
                          <option value="active">Active Now</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Submission Type</label>
                        <select
                          value={round.submissionType || 'github'}
                          onChange={(e) =>
                            updateRoundField(idx, 'submissionType', e.target.value as EventRound['submissionType'])
                          }
                          className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs font-bold"
                        >
                          <option value="github">GitHub Repo</option>
                          <option value="deck">Pitch Deck / Abstract</option>
                          <option value="link">External Link</option>
                          <option value="offline">Offline / Stage Demo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BANNER & DATES */}
          {sectionTab === 'schedule' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-500">Event Starts</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                    />
                    <input
                      type="time"
                      value={startTimeClock}
                      onChange={(e) => setStartTimeClock(e.target.value)}
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-500">Event Ends</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                    />
                    <input
                      type="time"
                      value={endTimeClock}
                      onChange={(e) => setEndTimeClock(e.target.value)}
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-slate-700 font-bold flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-nerdBlue" />
                    <span>Cover Banner Image</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-nerdBlue bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCover ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {coverUrl && (
                  <div className="h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={coverUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}

                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-nerdBlue"
                />

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BANNERS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setCoverUrl(p.url)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        coverUrl === p.url
                          ? 'bg-nerdBlue text-white border-nerdBlue'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {uploadError && <p className="text-[11px] text-amber-700 font-bold">{uploadError}</p>}
              </div>
            </div>
          )}

          {/* TAB 4: PRIZES & IMPORTANT LINKS */}
          {sectionTab === 'extras' && (
            <div className="space-y-6">
              {/* Prizes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Prize Tracks ({prizes.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={addPrize}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-nerdBlue font-bold text-[11px] hover:bg-blue-100 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prize</span>
                  </button>
                </div>

                {prizes.length === 0 ? (
                  <p className="text-xs text-slate-400">No prize tracks added yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {prizes.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Prize #{idx + 1}</span>
                          <button type="button" onClick={() => removePrize(idx)} className="text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) =>
                              setPrizes((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, title: e.target.value } : item))
                              )
                            }
                            placeholder="Track Title"
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm sm:text-xs"
                          />
                          <input
                            type="text"
                            value={p.amount}
                            onChange={(e) =>
                              setPrizes((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, amount: e.target.value } : item))
                              )
                            }
                            placeholder="Amount (e.g. $2,500)"
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm sm:text-xs font-bold text-nerdBlue"
                          />
                        </div>
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) =>
                            setPrizes((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, description: e.target.value } : item))
                            )
                          }
                          placeholder="Criteria / notes"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm sm:text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Important Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-nerdBlue" />
                    <span>Resource Links ({importantLinks.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-nerdBlue font-bold text-[11px] hover:bg-blue-100 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                {importantLinks.length === 0 ? (
                  <p className="text-xs text-slate-400">No Discord/WhatsApp/rulebook links added yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {importantLinks.map((lnk) => (
                      <div key={lnk.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={lnk.type}
                            onChange={(e) =>
                              setImportantLinks((prev) =>
                                prev.map((item) =>
                                  item.id === lnk.id
                                    ? { ...item, type: e.target.value as ImportantLink['type'] }
                                    : item
                                )
                              )
                            }
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                          >
                            <option value="discord">Discord</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="rulebook">Rulebook / Docs</option>
                            <option value="github">GitHub Repo</option>
                            <option value="notion">Notion / Guide</option>
                            <option value="custom">Custom Link</option>
                          </select>
                          <button type="button" onClick={() => removeLink(lnk.id)} className="text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={lnk.title}
                            onChange={(e) =>
                              setImportantLinks((prev) =>
                                prev.map((item) => (item.id === lnk.id ? { ...item, title: e.target.value } : item))
                              )
                            }
                            placeholder="Link label"
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm sm:text-xs"
                          />
                          <input
                            type="url"
                            value={lnk.url}
                            onChange={(e) =>
                              setImportantLinks((prev) =>
                                prev.map((item) => (item.id === lnk.id ? { ...item, url: e.target.value } : item))
                              )
                            }
                            placeholder="https://..."
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm sm:text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-nerdLime" />
                  <span>Save & Update Live Event</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
