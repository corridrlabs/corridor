import React from 'react';
import {
    Wallet, Users, TrendingUp, Zap, Globe, MessageSquare,
    GitBranch, DollarSign, Smartphone, Package, ArrowRight,
    CheckCircle, Lock, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CapabilityCard {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    route: string;
    status: 'active' | 'beta' | 'coming-soon';
    features: string[];
}

export const PlatformCapabilities: React.FC = () => {
    const navigate = useNavigate();

    const capabilities: CapabilityCard[] = [
        {
            id: 'financial-os',
            title: 'Financial OS',
            description: 'A single layer for money, people, and data',
            icon: Wallet,
            color: 'from-blue-500 to-cyan-500',
            route: '/dashboard/financial-os',
            status: 'active',
            features: ['Multi-currency wallet', 'Employee database', 'Transaction analytics']
        },
        {
            id: 'hybrid-rails',
            title: 'Hybrid Rails',
            description: 'Treat Fiat and Crypto as first-class citizens',
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            route: '/dashboard/hybrid-rails',
            status: 'active',
            features: ['Fiat processing', 'Crypto wallets', 'Cross-rail conversions']
        },
        {
            id: 'ussd-automation',
            title: 'USSD Automation',
            description: 'Programmatically interact with offline mobile money rails',
            icon: Smartphone,
            color: 'from-green-500 to-emerald-500',
            route: '/dashboard/ussd',
            status: 'active',
            features: ['M-Pesa automation', 'Airtel Money', 'SMS fallback']
        },
        {
            id: 'connectors',
            title: 'Connectors Marketplace',
            description: 'Plug-and-play integrations with Xero, Slack, Odoo etc.',
            icon: Package,
            color: 'from-orange-500 to-red-500',
            route: '/dashboard/connectors',
            status: 'active',
            features: ['50+ integrations', 'Custom connectors', 'OAuth flows']
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Payment Flow',
            description: 'Native WhatsApp interface for onboarding and transactions',
            icon: MessageSquare,
            color: 'from-teal-500 to-green-500',
            route: '/dashboard/whatsapp',
            status: 'beta',
            features: ['WhatsApp onboarding', 'Payment requests', 'Notifications']
        },
        {
            id: 'workflows',
            title: 'Workflow Automations',
            description: 'Build automated payment workflows tailored to your business',
            icon: GitBranch,
            color: 'from-indigo-500 to-purple-500',
            route: '/workflows',
            status: 'active',
            features: ['Visual builder', 'Pre-built templates', 'Trigger-based actions']
        }
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Active
                    </span>
                );
            case 'beta':
                return (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        <Sparkles className="w-3 h-3" />
                        Beta
                    </span>
                );
            case 'coming-soon':
                return (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <Lock className="w-3 h-3" />
                        Coming Soon
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Platform Capabilities
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Everything you need to run a modern financial stack, right out of the box
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capabilities.map((capability) => (
                    <div
                        key={capability.id}
                        onClick={() => capability.status === 'active' && navigate(capability.route)}
                        className={`
              group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 
              p-6 transition-all duration-300 overflow-hidden
              ${capability.status === 'active'
                                ? 'hover:shadow-xl hover:scale-105 cursor-pointer'
                                : 'opacity-75 cursor-not-allowed'
                            }
            `}
                    >
                        {/* Gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${capability.color}`}>
                                    <capability.icon className="w-6 h-6 text-white" />
                                </div>
                                {getStatusBadge(capability.status)}
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {capability.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {capability.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-4">
                                {capability.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${capability.color}`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Action */}
                            {capability.status === 'active' && (
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white group-hover:gap-3 transition-all">
                                    Explore
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">50+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Connectors</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Automation</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">150+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
                </div>
            </div>
        </div>
    );
};
