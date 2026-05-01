import React, { useState, useEffect } from 'react';
import { billingApi } from '../api/billing';
import { useAuthStore } from '../store/authStore';
import { DashboardSkeleton } from './ui/Skeleton';
import { CANONICAL_PRICING_CATALOG } from '../config/pricingCatalog';
import { Zap, CreditCard, ShieldCheck, ArrowRight, ExternalLink, AlertCircle, BarChart3, Users, Wallet, Key } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { BillingCycle, getPlanPeriodLabel, getPlanPrice } from '../utils/pricing';

export const BillingDashboard: React.FC = () => {
    const { user: authUser, refreshUser } = useAuthStore();
    const { showToast } = useToast();
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [customerPortalLoading, setCustomerPortalLoading] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    
    useEffect(() => {
        fetchBillingData();
        // Refresh user to get latest tier info
        refreshUser().catch(console.error);
    }, []);

    const fetchBillingData = async () => {
        setLoading(true);
        try {
            const usageData = await billingApi.getUsage();
            setUsage(usageData);
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setCustomerPortalLoading(true);
        try {
            const res = await billingApi.getCustomerPortal();
            if (res.portal_url) {
                window.open(res.portal_url, '_blank');
            } else {
                showToast('error', 'Customer portal not properly configured');
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to open customer portal');
        } finally {
            setCustomerPortalLoading(false);
        }
    };

    const handleUpgrade = async (planSlug: string) => {
        setUpgradeLoading(planSlug);
        try {
            const res = await billingApi.createCheckout({ plan_slug: planSlug });
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            } else {
                showToast('error', 'Checkout url missing from response');
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to initiate upgrade');
        } finally {
            setUpgradeLoading(null);
        }
    };

    if (loading) {
        return <DashboardSkeleton kpiCount={3} hasChart={false} />;
    }

    const currentTier = ((authUser as any)?.tier || 'free').toLowerCase();
    const activePlan = CANONICAL_PRICING_CATALOG.find(p => p.slug === currentTier) || CANONICAL_PRICING_CATALOG[0];

    const usageStats = [
        {
            title: 'API Requests',
            value: usage?.api_requests || 0,
            limit: activePlan.limits.api_access ? 'Unlimited' : 'N/A',
            icon: Key,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10 border-indigo-500/20'
        },
        {
            title: 'Wallets',
            value: usage?.wallets_count || 1, // Fallback to 1 if missing
            limit: activePlan.limits.wallet_limit === -1 ? 'Unlimited' : activePlan.limits.wallet_limit,
            icon: Wallet,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            title: 'Transactions',
            value: usage?.transactions_count || 0,
            limit: 'Unlimited (Pay-per-use)',
            icon: BarChart3,
            color: 'text-fuchsia-500',
            bg: 'bg-fuchsia-500/10 border-fuchsia-500/20'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Manage your subscription, view current limits, and update payment methods securely.
                </p>
            </div>

            {/* Current Plan Alert */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-violet-800 p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                    <Zap className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-100 mb-4">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Current Subscription
                        </div>
                        <h2 className="text-4xl font-black mb-2">{activePlan.name} Plan</h2>
                        <p className="text-indigo-200 text-lg max-w-md">
                            {activePlan.description}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleManageBilling}
                            disabled={customerPortalLoading}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            {customerPortalLoading ? 'Loading...' : 'Manage Payment Methods'}
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Usage Stats (Glassmorphic) */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Usage Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {usageStats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                            <div className={`p-3 rounded-2xl border ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{stat.title}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-500">/ {stat.limit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Tiers to Upgrade */}
            <div className="pt-8">
                <div className="text-center mb-10 flex flex-col items-center gap-4">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade your capabilities</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Scale seamlessly as your transaction volume and automation needs grow.</p>
                    
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-1.5 shadow-sm">
                        {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
                                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                                    billingCycle === cycle
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/20'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing'}
                            </button>
                        ))}
                    </div>
                    <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
                        billingCycle === 'yearly' ? 'border-orange-400/30 bg-orange-500/10 text-orange-400' : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'
                    }`}>
                        <span className="inline-block h-2 w-2 rounded-full bg-current animate-pulse" />
                        {billingCycle === 'yearly' ? 'Yearly pricing active' : 'Monthly pricing active'}
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CANONICAL_PRICING_CATALOG.map((plan) => {
                        const isCurrent = plan.slug === currentTier;
                        const isPopular = plan.popular;
                        const price = getPlanPrice(plan, billingCycle);

                        return (
                            <div 
                                key={plan.slug}
                                className={`rounded-3xl p-6 flex flex-col relative transition-all border
                                    ${isCurrent 
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-md' 
                                        : isPopular 
                                            ? 'border-orange-500 bg-white dark:bg-gray-900 shadow-xl' 
                                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md'
                                    }
                                    ${billingCycle === 'yearly' ? 'ring-1 ring-orange-500/5' : ''}
                                `}
                            >
                                {isPopular && !isCurrent && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-500/30">
                                        Most Popular
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                                        Active Plan
                                    </div>
                                )}
                                
                                <div className="mb-4">
                                    <h4 className={`text-xl font-bold ${isPopular && !isCurrent ? 'text-orange-500 dark:text-orange-400' : isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 min-h-[3rem]">{plan.description}</p>
                                </div>
                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
                                    {price !== '$0' && <span className="text-gray-500 font-medium text-sm">{getPlanPeriodLabel(billingCycle)}</span>}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(plan.slug)}
                                    disabled={isCurrent || upgradeLoading === plan.slug}
                                    className={`w-full py-2.5 rounded-xl transition-all font-bold text-sm mb-6 flex items-center justify-center gap-2
                                        ${isCurrent 
                                            ? 'bg-indigo-100 text-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-500 cursor-not-allowed' 
                                            : isPopular 
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
                                                : 'bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white shadow-sm'
                                        }
                                    `}
                                >
                                    {upgradeLoading === plan.slug ? 'Processing...' : isCurrent ? 'Current Plan' : plan.cta}
                                </button>

                                <ul className="space-y-3 flex-1 mt-2">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular && !isCurrent ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 flex gap-3 mt-10">
                <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upgrading to Payday Pro or Enterprise plans is processed securely through our billing partner Lemon Squeezy. Invoices and receipts for subscription charges will be emailed to your account address automatically.
                </p>
            </div>
        </div>
    );
};

export default BillingDashboard;
