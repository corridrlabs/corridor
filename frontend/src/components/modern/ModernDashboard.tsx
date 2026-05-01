import React, { useState } from 'react';
import { ArrowUpRight, TrendingUp, Zap, Shield, Globe } from 'lucide-react';
import { GlassButton, ModernCard } from '../ui/EnhancedComponents';
import { designTokens } from '../../styles/designSystem';
import clsx from 'clsx';


interface QuickActionProps {
    title: string;  
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    gradient?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
    title, 
    description, 
    icon, 
    onClick, 
    variant = 'primary',
    gradient = designTokens.gradients.primary 
}) => {
    return (
        <ModernCard 
            variant="glass" 
            padding="md" 
            className="group cursor-pointer hover:scale-[1.03] transition-all duration-300"
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-white/20 to-white/10 group-hover:from-white/30 group-hover:to-white/20 transition-all duration-300">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors">
                        {title}
                    </h3>
                 div   <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                </div></div>
            </ModernCard>
        );
};

interface RecentActivityProps {
    title: string;
    amount: string;
    type: 'income' | 'expense' | 'transfer';
    time: string;
    status: 'completed' | 'pending' | 'failed';
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
    title, 
    amount, 
    type, 
    time, 
    status 
}) => {
    const getIcon = () => {
        switch (type) {
            case 'income': return <TrendingUp className="w-5 h-5 text-success-600" />;
            case 'expense': return <Zap className="w-5 h-5 text-warning-600" />;
            case 'transfer': return <Globe className="w-5 h-5 text-primary-600" />;
            default: return <Shield className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'completed': return 'text-success-600 dark:text-success-400';
            case 'pending': return 'text-warning-600 dark:text-warning-400';
            case 'failed': return 'text-error-600 dark:text-error-400';
            default: return 'text-gray-600';
        }
    };

    return (
        <ModernCard variant="default" padding="sm" className="group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {type === 'income' && '+'}
                        {amount}
                    </p>
                </div>
                <div className="text-right">
                    <p className={clsx('text-sm font-medium', getStatusColor())}>
                        {status === 'completed' && '✓'}
                        {status === 'pending' && '⏳'}
                        {status === 'failed' && '✗'}
                        {' ' + time}
                    </p>
                </div>
            </div>
        </ModernCard>
    );
};

const WelcomeSection: React.FC = () => {
    const [greeting, setGreeting] = useState('');
    
    React.useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    return (
        <ModernCard 
            variant="gradient" 
            padding="lg" 
            className="mb-8 text-center"
            style={{ background: designTokens.gradients.sunset }}
        >
            <h1 className="text-4xl font-bold text-white mb-2">
                {greeting}, User! 👋
            </h1>
            <p className="text-white/90 text-lg mb-6">
                Welcome back to your financial command center. Ready to make today productive?
            </p>
            <div className="flex justify-center gap-4">
                <GlassButton variant="secondary" size="md">
                    View Tutorial
                </GlassButton>
                <GlassButton variant="primary" size="md" icon={Zap}>
                    Quick Start
                </GlassButton>
            </div>
        </ModernCard>
    );
};

interface StatsOverviewProps {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
    icon: React.ReactNode;
    gradient?: string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon, 
    gradient = designTokens.gradients.ocean 
}) => {
    return (
        <ModernCard 
            variant="glass" 
            padding="lg" 
            className="group hover:scale-[1.02] transition-all duration-300"
            style={{ background: gradient }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
                    <p className="text-white/80 text-sm">Last 30 days</p>
                </div>
                <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                    {icon}
                </div>
            </div>
            <div className="text-center">
                <p className="text-4xl font-bold text-white mb-2">{value}</p>
                <div className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                    changeType === 'increase' ? 'bg-success-500/20 text-success-300' : 'bg-error-500/20 text-error-300'
                )}>
                    {changeType === 'increase' ? '↑' : '↓'}
                    {' ' + change}
                </div>
            </div>
        </ModernCard>
    );
};

interface ModernDashboardProps {
    userName?: string;
    onQuickAction?: (action: string) => void;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ 
    userName = 'User',
    onQuickAction 
}) => {
    const quickActions = [
        {
            title: 'Send Payment',
            description: 'Quick money transfers to anyone',
            icon: <TrendingUp className="w-6 h-6 text-primary-600" />,
            onClick: () => onQuickAction?.('send-payment'),
            gradient: designTokens.gradients.success
        },
        {
            title: 'Request Funds',
            description: 'Get paid by clients instantly',
            icon: <Zap className="w-6 h-6 text-secondary-600" />,
            onClick: () => onQuickAction?.('request-funds'),
            gradient: designTokens.gradients.ocean
        },
        {
            title: 'View Analytics',
            description: 'Deep insights into your finances',
            icon: <Shield className="w-6 h-6 text-warning-600" />,
            onClick: () => onQuickAction?.('view-analytics'),
            gradient: designTokens.gradients.sunset
        },
        {
            title: 'Manage Settings',
            description: 'Control your account preferences',
            icon: <Globe className="w-6 h-6 text-error-600" />,
            onClick: () => onQuickAction?.('manage-settings'),
            gradient: designTokens.gradients.midnight
        }
    ];

    const recentActivities = [
        {
            title: 'Client Payment',
            amount: 'KES 5,000',
            type: 'income' as const,
            time: '2 hours ago',
            status: 'completed' as const
        },
        {
            title: 'Supplier Transfer',
            amount: 'KES 2,500',
            type: 'expense' as const,
            time: '5 hours ago',
            status: 'completed' as const
        },
        {
            title: 'Team Payout',
            amount: 'KES 1,200',
            type: 'transfer' as const,
            time: '1 day ago',
            status: 'pending' as const
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Section */}
                <WelcomeSection />

                {/* Quick Actions Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                        What would you like to do today?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quickActions.map((action, index) => (
                            <QuickAction 
                                key={index}
                                {...action}
                            />
                        ))}
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <StatsOverview
                        title="Total Balance"
                        value="KES 45,000"
                        change="+12.5%"
                        changeType="increase"
                        icon={<TrendingUp className="w-6 h-6 text-white" />}
                    />
                    <StatsOverview
                        title="Monthly Revenue"
                        value="KES 120,000"
                        change="+8.3%"
                        changeType="increase"
                        icon={<Zap className="w-6 h-6 text-white" />}
                        gradient={designTokens.gradients.success}
                    />
                    <StatsOverview
                        title="Active Transactions"
                        value="248"
                        change="+15.2%"
                        changeType="increase"
                        icon={<Shield className="w-6 h-6 text-white" />}
                        gradient={designTokens.gradients.sunset}
                    />
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                            <RecentActivity 
                                key={index}
                                {...activity}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};