import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavItem {
    label: string;
    items: {
        title: string;
        description: string;
        link: string;
    }[];
}

const navItems: NavItem[] = [
    {
        label: 'Product OS',
        items: [
            { title: 'Getting Started', description: 'Quick start guide', link: '/docs/getting-started' },
            { title: 'Data Warehouse', description: 'Store and analyze data', link: '/docs/data-warehouse' },
            { title: 'Integrations', description: '120+ connectors', link: '/docs/integrations' },
            { title: 'API & Webhooks', description: 'Programmatic access', link: '/docs/api' }
        ]
    },
    {
        label: 'Analytics',
        items: [
            { title: 'Getting Started', description: 'Analytics overview', link: '/docs/analytics' },
            { title: 'Dashboards', description: 'Custom dashboards', link: '/docs/dashboards' },
            { title: 'Revenue Analytics', description: 'MRR, ARR, churn', link: '/docs/revenue' },
            { title: 'Real-time Monitoring', description: 'Live metrics', link: '/docs/realtime' }
        ]
    },
    {
        label: 'Payments',
        items: [
            { title: 'Getting Started', description: 'Payment setup', link: '/docs/payments' },
            { title: 'Connectors', description: 'M-Pesa, Stripe, PayPal', link: '/docs/connectors' },
            { title: 'Transactions', description: 'Track payments', link: '/docs/transactions' },
            { title: 'Invoices', description: 'Automated billing', link: '/docs/invoices' },
            { title: 'Subscriptions', description: 'Recurring payments', link: '/docs/subscriptions' }
        ]
    },
    {
        label: 'Automation',
        items: [
            { title: 'Getting Started', description: 'Automation basics', link: '/docs/automation' },
            { title: 'Workflows', description: 'Visual builder', link: '/docs/workflows' },
            { title: 'Webhooks', description: 'Event notifications', link: '/docs/webhooks' },
            { title: 'AI Orchestration', description: 'AI-powered automation', link: '/docs/ai' }
        ]
    },
    {
        label: 'Team',
        items: [
            { title: 'Getting Started', description: 'Team setup', link: '/docs/team' },
            { title: 'Team Management', description: 'Roles & permissions', link: '/docs/team-management' },
            { title: 'Projects', description: 'Project organization', link: '/docs/projects' },
            { title: 'Collaboration', description: 'Work together', link: '/docs/collaboration' }
        ]
    },
    {
        label: 'EWA',
        items: [
            { title: 'Getting Started', description: 'EWA overview', link: '/docs/ewa' },
            { title: 'Employee Portal', description: 'Self-service access', link: '/docs/ewa/portal' },
            { title: 'Advance Management', description: 'Track advances', link: '/docs/ewa/advances' },
            { title: 'Payroll Integration', description: 'Sync payroll', link: '/docs/ewa/payroll' }
        ]
    }
];

export const LandingNav: React.FC = () => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleNavigation = (link: string) => {
        if (link.startsWith('/docs')) {
            // For now, navigate to home or show coming soon
            console.log('Documentation coming soon:', link);
        } else {
            navigate(link);
        }
        setActiveDropdown(null);
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => navigate('/')}
                            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                        >
                            Corridor
                        </button>

                        {/* Navigation Items */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => setActiveDropdown(item.label)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                                        {item.label}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {/* Dropdown */}
                                    {activeDropdown === item.label && (
                                        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-fadeIn">
                                            {item.items.map((subItem, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleNavigation(subItem.link)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="font-medium text-gray-900 text-sm mb-0.5">
                                                        {subItem.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {subItem.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="px-4 py-2 bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] text-white font-semibold rounded-lg hover:shadow-lg shadow-blue-900/25 transition-all flex items-center gap-2 text-sm"
                    >
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </nav>
    );
};
