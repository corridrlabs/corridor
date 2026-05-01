import React, { useState } from 'react';

const releases = [
  {
    version: 'v0.0.1',
    date: '2026-04-28',
    items: [
      'Introduced the first public pre-launch release of Corridor platform surfaces.',
      'Launched end-to-end waitlist flow: public signup capture, backend persistence, and admin waitlist inbox.',
      'Added admin campaign messaging for waitlist users with branded email delivery support.',
      'Shipped legal, privacy, and about foundations for production readiness.',
      'Added docs productivity tools: page-level markdown copy and one-click handoff to AI chat assistants.',
      'Refined landing, pricing, auth, and payment-link UX copy to reduce robotic language and improve clarity.',
      'Implemented KYC/profile completion enforcement across protected app flows.',
      'Hardened sensitive backend routes with server-side compliance checks to prevent direct API bypass.',
      'Expanded SEO and sitemap support for global discoverability.',
      'Improved footer information architecture: privacy, legal, security, changelog, and support access.',
    ],
  },
  {
    version: 'v0.0.1-rc.1',
    date: '2026-04-27',
    items: [
      'Stabilized admin operations with audit-aware controls and clearer management workflows.',
      'Strengthened payment-link and invoice reliability under real user interaction patterns.',
      'Expanded docs and developer navigation structure for faster feature discovery.',
    ],
  },
  {
    version: 'v0.0.1-alpha.1',
    date: '2026-04-26',
    items: [
      'Bootstrapped pre-release platform baseline: frontend architecture, backend integrations, and docs scaffolding.',
      'Connected core financial rails and foundational account flows needed for launch hardening.',
      'Prepared public developer ecosystem surfaces (SDK/docs/MCP repository structure).',
    ],
  },
];

export default function Changelog() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const openGithubSoon = () => {
    setShowComingSoon(true);
    window.setTimeout(() => setShowComingSoon(false), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-black tracking-tight">Changelog</h1>
          <button
            type="button"
            onClick={openGithubSoon}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            GitHub
          </button>
        </div>
        <p className="mt-3 text-slate-300">Pre-launch feature changelog. Corridor is currently in `v0.x` until production launch.</p>
        {showComingSoon && (
          <div className="mt-4 inline-flex rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Coming soon
          </div>
        )}

        <div className="mt-10 space-y-5">
          {releases.map((release) => (
            <section key={release.version} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-orange-300">{release.version}</h2>
                <span className="text-sm text-slate-400">{release.date}</span>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-200">
                {release.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
