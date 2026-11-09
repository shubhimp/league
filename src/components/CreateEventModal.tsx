import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Link as LinkIcon, Trophy, Layers, ArrowRight } from 'lucide-react';
import { EventRound, ImportantLink, HackEvent, EventType } from '../types';
import { hackApi } from '../services/hackApi';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: HackEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
  const currentUser = hackApi.getCurrentUser();
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('hackathon');
  const [location, setLocation] = useState('Online / Discord');
  const [prizeAmount, setPrizeAmount] = useState('$5,000');
  const [tagsStr, setTagsStr] = useState('AI Agents, Rust, Hardware');
  const [organizerName, setOrganizerName] = useState(currentUser?.name || 'Aditya Sharma');
  const [organizerOrg, setOrganizerOrg] = useState(currentUser?.college || 'Nerds Room Lead Organizer');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80');
  const [visibility, setVisibility] = useState<'approved' | 'private'>('approved');

  // Rounds State
  const [rounds, setRounds] = useState<EventRound[]>([
    {
      id: 'rnd_' + Date.now(),
      roundNumber: 1,
      title: 'Round 1: Idea Submission & Registration',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      description: 'Submit your team members and abstract pitch deck.',
      status: 'active',
      submissionType: 'deck'
    },
    {
      id: 'rnd_' + (Date.now() + 1),
      roundNumber: 2,
      title: 'Round 2: Prototype Code Submission',
      startDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      description: 'Submit public GitHub repo and 2-minute video demo.',
      status: 'upcoming',
      submissionType: 'github'
    }
  ]);

  // Important Links State
  const [links, setLinks] = useState<ImportantLink[]>([
    { id: 'lnk_1', title: 'Discord Community', url: 'https://discord.gg/nerdsroom', type: 'discord' },
    { id: 'lnk_2', title: 'Problem Statements & Rulebook', url: 'https://notion.so/nerdsroom', type: 'rulebook' }
  ]);

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const addRound = () => {
    const nextNum = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        id: 'rnd_' + Date.now(),
        roundNumber: nextNum,
        title: `Round ${nextNum}: Final Demo & Presentation`,
        startDate: new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
        description: 'Offline presentation or live Discord stage pitch.',
        status: 'upcoming',
        submissionType: 'offline'
      }
    ]);
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter(r => r.id !== id));
  };

  const addLink = () => {
    if (!newLinkTitle || !newLinkUrl) return;
    setLinks([
      ...links,
      {
        id: 'lnk_' + Date.now(),
        title: newLinkTitle,
        url: newLinkUrl,
        type: 'custom'
      }
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const prizes = prizeAmount ? [{ title: 'Main Prize Pool', amount: prizeAmount, description: 'Cash bounties and grants' }] : [];

    const newEvent = await hackApi.createEvent({
      title: title.trim(),
      tagline: tagline.trim() || 'A Nerds Room Event',
      description: description.trim() || 'Join us for an exciting hackathon with intense building and great prizes.',
      eventType,
      location,
      organizerName: organizerName.trim() || 'Aditya Sharma',
      organizerOrg: organizerOrg.trim() || 'Nerds Room Lead Organizer',
      coverUrl: coverUrl.trim(),
      approvalStatus: visibility,
      tags,
      prizes,
      rounds,
      importantLinks: links
    });

    onEventCreated(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-nerdDark via-nerdBlue to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-black text-lg tracking-tight">
              <span>Create Event & Rounds</span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Host a new hackathon, workshop, or meetup with custom rounds & links.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto font-sans">
          
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-nerdBlue" />
              <span>Event Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Agents & Cybernetics Sprint"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold"
                >
                  <option value="hackathon">Hackathon</option>
                  <option value="ideathon">Ideathon</option>
                  <option value="workshop">Workshop</option>
                  <option value="meetup">Meetup</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Tagline / Short Pitch</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. 36 hours of local agent development and compiler hacking."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru / Online Discord"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Prize Bounty</label>
                <input
                  type="text"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  placeholder="e.g. $10,000 or ₹2,00,000"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-nerdBlue"
                />
              </div>
            </div>

            {/* Organizer Details & Visibility (Crucial Feature) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Organizer Name *</label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="e.g. Aditya Sharma or Shubhi Mathur"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Organizer Organization / Chapter</label>
                <input
                  type="text"
                  value={organizerOrg}
                  onChange={(e) => setOrganizerOrg(e.target.value)}
                  placeholder="e.g. Nerds Room Campus Lead or MITS Chapter"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Cover Banner URL (Cloudflare / Unsplash)</label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Cloudflare URL"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'approved' | 'private')}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-nerdBlue rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold"
                >
                  <option value="approved">🌍 Public (Approved & Live on Website)</option>
                  <option value="private">🔒 Private (Access via Secret Link Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Rounds Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-nerdBlue" />
                <span>Event Rounds / Stages ({rounds.length})</span>
              </h3>
              <button
                type="button"
                onClick={addRound}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-nerdBlue hover:bg-blue-100 font-bold text-[11px] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Round</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {rounds.map((round, idx) => (
                <div key={round.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Round {idx + 1}: {round.title}
                    </span>
                    {rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRound(round.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={round.title}
                    onChange={(e) => {
                      const updated = [...rounds];
                      updated[idx].title = e.target.value;
                      setRounds(updated);
                    }}
                    placeholder="Round Title"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Start Date:</span>
                      <input
                        type="date"
                        value={round.startDate}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].startDate = e.target.value;
                          setRounds(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Deadline:</span>
                      <input
                        type="date"
                        value={round.endDate}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].endDate = e.target.value;
                          setRounds(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Links Builder */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-nerdBlue" />
              <span>Important Links & Resources ({links.length})</span>
            </h3>

            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{link.title}</span>
                    <span className="text-[10px] text-slate-500 truncate block max-w-sm">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add New Link Bar */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Link Title (e.g. WhatsApp Group)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="px-3 py-1.5 rounded-lg bg-nerdBlue text-white font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-nerdBlue hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Publish Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
