import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ExternalLink, BellRing, Github } from 'lucide-react';
import { BrandWordmark } from './BrandWordmark';

const productLinks = [
  { label: 'Features', href: '/#features', external: true },
  { label: 'Pricing', href: '/pricing', external: false },
  { label: 'Status', href: '/status', external: false },
  { label: 'Dashboard', href: '/dashboard', external: false },
];

const resourceLinks = [
  { label: 'Documentation', href: '/docs', external: false },
  { label: 'Developer Docs', href: '/docs/api-reference/overview', external: false },
  { label: 'Business Guide', href: '/docs/business/getting-started/welcome', external: false },
  { label: 'API Quickstart', href: '/docs/api-reference/quickstart', external: false },
];

const companyLinks = [
  { label: 'About', href: '/about', external: false },
  { label: 'Privacy', href: '/privacy', external: false },
  { label: 'Security', href: '/docs/security', external: false },
  { label: 'Legal Notice', href: '/legal', external: false },
  { label: 'Contact', href: 'mailto:jamesthaura51@gmail.com', external: true },
  { label: 'Changelog', href: '/changelog', external: false },
  { label: 'GitHub', href: 'https://github.com/corridrlabs', external: true },
];

const renderLink = ({ label, href, external }: { label: string; href: string; external: boolean }) => {
  const baseClass = 'inline-flex items-center gap-1 text-sm text-slate-300 hover:text-orange-400 transition-colors';

  if (external) {
    return (
      <a key={label} href={href} className={baseClass} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}>
        {label}
        {href.startsWith('http') && <ExternalLink className="w-3 h-3" />}
      </a>
    );
  }

  return (
    <Link key={label} to={href} className={baseClass}>
      {label}
    </Link>
  );
};

export const Footer = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/landing' || location.pathname === '/';

  return (
    <footer className="border-t border-white/10 bg-black px-6 pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className={`mb-5 flex items-center ${isLandingPage ? 'gap-0' : 'gap-2'}`}>
              <div className="flex h-8 w-8 items-center justify-center">
                <img src="/corridor-logo.svg" alt="Corridor" className="h-8 w-8" />
              </div>
              <BrandWordmark className="text-xl" showLeadingC={!isLandingPage} />
            </div>
            <p className="max-w-xs text-sm text-slate-400">
              Financial operating system for modern teams across treasury, payroll, payments, and embedded finance.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a href="mailto:jamesthaura51@gmail.com" className="text-slate-400 hover:text-orange-400 transition-colors" aria-label="Email support">
                <Mail className="h-4 w-4" />
              </a>
              <a href="https://github.com/corridrlabs" target="_blank" rel="noreferrer noopener" className="text-slate-400 hover:text-orange-400 transition-colors" aria-label="Corridor GitHub">
                <Github className="h-4 w-4" />
              </a>
            </div>
            <Link
              to="/changelog"
              className="group mt-6 inline-flex items-center gap-2 rounded-2xl border border-orange-400/40 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 px-5 py-3 text-sm font-bold text-orange-200 shadow-[0_0_0_1px_rgba(251,146,60,0.2),0_0_35px_rgba(251,146,60,0.25)] transition-all hover:scale-[1.03] hover:shadow-[0_0_0_1px_rgba(251,146,60,0.5),0_0_45px_rgba(251,146,60,0.45)] animate-pulse"
            >
              <BellRing className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Subscribe to Updates & Patches
            </Link>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">Product</h4>
            <div className="flex flex-col gap-3">{productLinks.map(renderLink)}</div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">Resources</h4>
            <div className="flex flex-col gap-3">{resourceLinks.map(renderLink)}</div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">Company</h4>
            <div className="flex flex-col gap-3">{companyLinks.map(renderLink)}</div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>© 2026 Corridor Labs Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="hover:text-slate-200 transition-colors">Privacy</Link>
            <Link to="/legal" className="hover:text-slate-200 transition-colors">Legal</Link>
            <Link to="/status" className="hover:text-slate-200 transition-colors">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
