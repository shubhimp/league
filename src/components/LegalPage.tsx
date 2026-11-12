import React from 'react';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

interface LegalPageProps {
  mode: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ mode, onBack }) => {
  const isPrivacy = mode === 'privacy';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-nerdLime selection:text-nerdDark flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <img
              src="/logo.png"
              alt="League by Nerds Room Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-md"
            />
            <span className="font-black text-base sm:text-xl tracking-tight text-nerdBlue whitespace-nowrap">
              League by Nerds Room<span className="text-nerdLime">.</span>
            </span>
          </a>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-nerdBlue text-xs font-bold text-slate-700 hover:text-nerdBlue bg-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to League</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-nerdBlue flex items-center justify-center shrink-0">
              {isPrivacy ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-nerdDark tracking-tight">
                {isPrivacy ? 'Privacy Policy — League by Nerds Room' : 'Terms of Service — League by Nerds Room'}
              </h1>
              <p className="text-xs text-slate-500">
                Effective Date: November 2026 • Domain: league.nerdsroom.org
              </p>
            </div>
          </div>

          {isPrivacy ? (
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                <strong>League by Nerds Room</strong> (hosted at <code className="font-mono text-nerdBlue">https://league.nerdsroom.org</code>)
                is the official hackathon, workshop, and community challenge platform operated by <strong>Nerds Room</strong>.
              </p>

              <h2 className="text-base font-bold text-slate-900 pt-2">1. Information We Collect</h2>
              <p>
                When you sign in using <strong>Google Sign-In</strong> or Email &amp; Password, we collect only basic
                identity information required to create and secure your account:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your full name and email address</li>
                <li>Your Google profile picture URL (when using Google Sign-In)</li>
                <li>Event registrations, QR check-in passes, team matchmaking details, and project submissions you voluntarily submit</li>
              </ul>

              <h2 className="text-base font-bold text-slate-900 pt-2">2. How We Use Your Data</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authenticate your account and issue verifiable QR entry passes for Nerds Room events.</li>
                <li>Display event schedules, team listings, and hackathon project demos within the platform.</li>
                <li>Send essential transactional account confirmations and event verification emails.</li>
              </ul>
              <p>We never sell your personal information or Google user data to third parties or advertisers.</p>

              <h2 className="text-base font-bold text-slate-900 pt-2">3. Infrastructure &amp; Security</h2>
              <p>
                Authentication and database storage are secured via encrypted HTTPS connections. Uploaded event cover images
                are stored on Cloudinary CDN. You may request account or data deletion at any time by contacting{' '}
                <a href="mailto:hello@nerdsroom.org" className="text-nerdBlue font-bold underline">
                  hello@nerdsroom.org
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                By accessing or signing in to <strong>League by Nerds Room</strong> (<code className="font-mono text-nerdBlue">league.nerdsroom.org</code>),
                you agree to follow community guidelines across all events, hackathons, and challenges.
              </p>

              <h2 className="text-base font-bold text-slate-900 pt-2">1. Accounts &amp; Conduct</h2>
              <p>
                Users are responsible for providing accurate registration details and upholding a respectful, collaborative
                builder environment across workshops, team matchmaking boards, and project submissions.
              </p>

              <h2 className="text-base font-bold text-slate-900 pt-2">2. Organizer &amp; Event Rules</h2>
              <p>
                Event organizers are responsible for publishing accurate round schedules, prizes, and check-in guidelines.
                Nerds Room reserves the right to moderate spam, abusive content, or unauthorized submissions.
              </p>

              <h2 className="text-base font-bold text-slate-900 pt-2">3. Contact</h2>
              <p>
                Questions regarding platform access, event partnerships, or terms may be directed to{' '}
                <a href="mailto:hello@nerdsroom.org" className="text-nerdBlue font-bold underline">
                  hello@nerdsroom.org
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
