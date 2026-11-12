import React, { useState, useRef, useMemo } from 'react';
import { X, Calendar, Trophy, ArrowRight, Upload, Image as ImageIcon, Clock, Sparkles } from 'lucide-react';
import { HackEvent, EventType } from '../types';
import { hackApi } from '../services/hackApi';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: HackEvent) => void;
}

const PRESET_BANNERS = [
  { label: 'Matrix Dark', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cyber Circuit', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'AI Terminal', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Builder Arena', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
];

function computeDurationLabel(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 'Set end date/time after start';
  const totalHours = Math.round(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours} ${totalHours === 1 ? 'Hour' : 'Hours'}`;
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  return remHours > 0
    ? `${days} ${days === 1 ? 'Day' : 'Days'}, ${remHours} hrs (${totalHours}h total)`
    : `${days} ${days === 1 ? 'Day' : 'Days'} (${totalHours}h total)`;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
  const currentUser = hackApi.getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('hackathon');
  const [venueType, setVenueType] = useState<'hybrid' | 'in-person' | 'virtual'>('hybrid');
  const [location, setLocation] = useState('Online / Discord');
  const [organizerName, setOrganizerName] = useState(currentUser?.name || '');

  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [startTimeClock, setStartTimeClock] = useState('09:00');
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 9).toISOString().split('T')[0]
  );
  const [endTimeClock, setEndTimeClock] = useState('18:00');

  const [coverUrl, setCoverUrl] = useState(PRESET_BANNERS[0].url);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const startTimeIso = useMemo(() => {
    const dt = new Date(`${startDate}T${startTimeClock || '09:00'}:00`);
    return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  }, [startDate, startTimeClock]);

  const endTimeIso = useMemo(() => {
    const dt = new Date(`${endDate}T${endTimeClock || '18:00'}:00`);
    return Number.isNaN(dt.getTime()) ? new Date(Date.now() + 86400000 * 2).toISOString() : dt.toISOString();
  }, [endDate, endTimeClock]);

  const durationSummary = useMemo(
    () => computeDurationLabel(startTimeIso, endTimeIso),
    [startTimeIso, endTimeIso]
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setErrorMsg('');

    if (new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
      setErrorMsg('End date & time must be after the start date & time.');
      return;
    }

    setSubmitting(true);
    try {
      const newEvent = await hackApi.createEvent({
        title: title.trim(),
        tagline: tagline.trim() || 'Build, ship, and compete at Nerds Room League.',
        description:
          description.trim() ||
          'Join fellow builders to collaborate, ship projects, and compete across event rounds.',
        eventType,
        venueType,
        location: location.trim() || 'Online / Discord',
        startTime: startTimeIso,
        endTime: endTimeIso,
        organizerName: organizerName.trim() || currentUser?.name || 'Community Organizer',
        organizerOrg: currentUser?.college || 'Nerds Room Community',
        coverUrl: coverUrl.trim() || PRESET_BANNERS[0].url,
        approvalStatus: 'approved',
        tags: [eventType === 'hackathon' ? 'Hackathon' : eventType, 'NerdsRoom'],
        prizes: [],
        rounds: [
          {
            id: 'rnd_' + Date.now(),
            roundNumber: 1,
            title: 'Round 1: Main Submission & Demos',
            startDate,
            endDate,
            description: 'Build and submit your project before the event deadline.',
            status: 'active',
            submissionType: 'github',
          },
        ],
        importantLinks: [],
      });

      onEventCreated(newEvent);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to create event right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-4 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <div className="font-black text-base sm:text-lg tracking-tight">Host a New Event</div>
            <p className="text-xs text-blue-100 mt-0.5">
              Quick setup: basic details, duration, and cover banner.
            </p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs font-sans">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Event Details */}
          <div className="space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-nerdBlue" />
              <span>1. Event Basic Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Agents Buildathon"
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none font-bold"
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
                placeholder="One line describing what builders will do"
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Event Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share overview, eligibility, and what attendees should expect..."
                className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Format</label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value as 'hybrid' | 'in-person' | 'virtual')}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none font-bold"
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
                  placeholder="e.g. Bengaluru / Online"
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Host Name *</label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2.5 text-sm sm:text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Duration & Schedule */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-nerdBlue" />
                <span>2. Duration & Schedule</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-nerdBlue border border-blue-200 text-[11px] font-bold">
                <Clock className="w-3 h-3" />
                <span>{durationSummary}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="block text-[11px] font-black uppercase text-slate-500">Starts</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={startTimeClock}
                    onChange={(e) => setStartTimeClock(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="block text-[11px] font-black uppercase text-slate-500">Ends</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={endTimeClock}
                    onChange={(e) => setEndTimeClock(e.target.value)}
                    className="w-full min-w-0 bg-white border border-slate-200 focus:border-nerdBlue rounded-xl px-2.5 py-2 text-sm sm:text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Banner */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-nerdBlue" />
                <span>3. Event Cover Banner</span>
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-1 text-[11px] font-black text-nerdBlue bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingCover ? 'Uploading...' : 'Upload Banner Image'}</span>
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
              <div className="h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={coverUrl} alt="Banner Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Paste image URL or choose a preset below"
              className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            />

            <div className="flex flex-wrap gap-1.5">
              {PRESET_BANNERS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setCoverUrl(p.url);
                    setUploadError('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    coverUrl === p.url
                      ? 'bg-nerdBlue text-white border-nerdBlue'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-nerdBlue'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {uploadError && (
              <p className="text-[11px] text-amber-700 font-bold leading-snug">{uploadError}</p>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-nerdBlue shrink-0 mt-0.5" />
            <span>
              After publishing, open <strong>Organizer Panel → Edit Event</strong> anytime to customize the event URL slug, edit round titles & stages, prizes, and resource links.
            </span>
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{submitting ? 'Publishing Event...' : 'Publish Event'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
