import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import SEO_Comprehensive from './SEO_Comprehensive';
import Breadcrumbs from './Breadcrumbs';
import { CookieConsent } from './CookieConsent';

import { GlobalBackground } from './ui/GlobalBackground';

interface PublicLayoutProps {
    children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getSEOProps = () => {
        switch (currentPath) {
            case '/':
                return {
                    title: 'Financial OS for Social Payments | Modern Business Finance',
                    description: 'Corridor: The Financial OS for Social Payments. Connect accounts, automate workflows, and manage group finances with ease for teams worldwide.',
                    keywords: 'financial OS, social payments, global fintech, payroll automation, vendor payments, cross-border payments, payment orchestration',
                    breadcrumbs: [{ name: 'Home', url: '/' }]
                };
            case '/pricing':
                return {
                    title: 'Pricing Plans | Corridor Financial OS',
                    description: 'Simple, transparent pricing for Corridor Financial OS. Start free and scale your business payment operations globally.',
                    keywords: 'pricing, payment fees, transaction costs, fintech pricing, business payment plans, global payment solutions',
                    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Pricing', url: '/pricing' }]
                };
            case '/docs':
                return {
                    title: 'Documentation | Corridor API & Platform Guides',
                    description: 'Complete documentation for Corridor Financial OS. Learn to integrate payments, automate workflows, and build financial applications.',
                    keywords: 'documentation, API docs, integration guide, developer resources, payment API, fintech documentation',
                    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Documentation', url: '/docs' }]
                };
            case '/docs/developers':
                return {
                    title: 'Developer Documentation | Corridor API & SDK',
                    description: 'Developer resources for Corridor API integration. Code examples, SDK documentation, and technical guides for building payment solutions.',
                    keywords: 'developer API, payment SDK, integration guide, code examples, REST API, webhook documentation',
                    breadcrumbs: [
                        { name: 'Home', url: '/' },
                        { name: 'Documentation', url: '/docs' },
                        { name: 'Developers', url: '/docs/developers' }
                    ]
                };
            case '/docs/businesses':
                return {
                    title: 'Business Documentation | Corridor Platform Guide',
                    description: 'Complete guide for businesses using Corridor Financial OS. Setup, workflows, and best practices for payment automation.',
                    keywords: 'business guide, payment automation, workflow setup, treasury management, business finance operations',
                    breadcrumbs: [
                        { name: 'Home', url: '/' },
                        { name: 'Documentation', url: '/docs' },
                        { name: 'Businesses', url: '/docs/businesses' }
                    ]
                };
            case '/docs/partners':
                return {
                    title: 'Partner Documentation | Corridor Integration Partners',
                    description: 'Partner resources for Corridor Financial OS. Integration guides, technical documentation, and partnership opportunities.',
                    keywords: 'partner program, integration partners, technical documentation, partnership opportunities, fintech partnerships',
                    breadcrumbs: [
                        { name: 'Home', url: '/' },
                        { name: 'Documentation', url: '/docs' },
                        { name: 'Partners', url: '/docs/partners' }
                    ]
                };
            case '/docs/collaborators':
                return {
                    title: 'Collaborator Program | Corridor Community & Ambassadors',
                    description: 'Join the Corridor collaborator program. Become an ambassador, contribute to the community, and help shape the future of social payments.',
                    keywords: 'collaborator program, community ambassadors, fintech community, open source collaboration, payment community',
                    breadcrumbs: [
                        { name: 'Home', url: '/' },
                        { name: 'Documentation', url: '/docs' },
                        { name: 'Collaborators', url: '/docs/collaborators' }
                    ]
                };
            default:
                return {
                    title: 'Corridor | Financial OS for Social Payments',
                    description: 'The Financial OS for Social Payments. Connect accounts, automate workflows, and manage group finances with ease.',
                    keywords: 'Corridor, financial OS, social payments, fintech, payments, business finance',
                    breadcrumbs: [{ name: 'Home', url: '/' }]
                };
        }
    };

    const seoProps = getSEOProps();

    return (
        <div className="min-h-screen text-slate-900 font-sans relative">
            <GlobalBackground />
            <SEO_Comprehensive {...seoProps} />
            <Navbar />
            <main className="relative z-10">
                {/* Only show breadcrumbs for docs and pricing pages */}
                {(currentPath.startsWith('/docs') || currentPath === '/pricing') && (
                    <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200">
                        <Breadcrumbs />
                    </div>
                )}
                {children || <Outlet />}
            </main>
            <Footer />
            <CookieConsent />
        </div>
    );
};
