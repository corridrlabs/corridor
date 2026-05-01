import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, Zap, Globe, Shield, Smartphone, CreditCard, Banknote, Building, Server, Users, Workflow } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { billingApi, BillingFeeSchedule } from '../api/billing';
import { CANONICAL_PRICING_CATALOG } from '../config/pricingCatalog';
import { BillingCycle, getPlanPeriodLabel, getPlanPrice } from '../utils/pricing';
import { savePendingUpgradePlan } from '../utils/upgradeIntent';
import { useAuthStore } from '../store/authStore';

const FALLBACK_FEE_SCHEDULE: BillingFeeSchedule = {
    currency: 'USD',
    ewa_withdrawal_flat_fee: 2.5,
    ewa_withdrawal_unit: 'per withdrawal',
    social_contribution_fee_rate: 0.01,
    payout_fee_rates: {
        free: 0.015,
        pro: 0.01,
        premium: 0.005,
        enterprise: 0.005,
    },
};

const Pricing = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [feeSchedule, setFeeSchedule] = useState<BillingFeeSchedule>(FALLBACK_FEE_SCHEDULE);
    const [feeError, setFeeError] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;
    const cycleTone = billingCycle === 'yearly'
        ? {
            wrapper: 'border-orange-400/40 bg-orange-500/5 shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_20px_60px_rgba(249,115,22,0.12)]',
            accent: 'border-orange-200 bg-orange-500/10 text-orange-400',
            badge: 'Yearly plan on',
            pill: 'bg-orange-600 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/20',
        }
        : {
            wrapper: 'border-indigo-400/40 bg-indigo-500/5 shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_20px_60px_rgba(99,102,241,0.12)]',
            accent: 'border-indigo-200 bg-indigo-500/10 text-indigo-400',
            badge: 'Monthly plan on',
            pill: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/20',
        };

    useEffect(() => {
        let mounted = true;
        void billingApi.getFees()
            .then((data) => {
                if (!mounted) return;
                setFeeSchedule({
                    ...FALLBACK_FEE_SCHEDULE,
                    ...data,
                    payout_fee_rates: {
                        ...FALLBACK_FEE_SCHEDULE.payout_fee_rates,
                        ...(data?.payout_fee_rates || {}),
                    },
                });
                setFeeError(null);
            })
            .catch((err: any) => {
                if (!mounted) return;
                setFeeError(err?.message || 'Using fallback fee schedule');
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Pricing structured data
    const pricingStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Corridor Financial OS',
        description: 'Simple pricing for teams that collect, send, and manage payments.',
        brand: {
            '@type': 'Brand',
            name: 'Corridor'
        },
        offers: [
            ...CANONICAL_PRICING_CATALOG.map((plan) => ({
                '@type': 'Offer',
                name: `${plan.name} Plan`,
                price: getPlanPrice(plan, billingCycle).replace('$', ''),
                priceCurrency: 'USD',
                billingDuration: billingCycle === 'yearly' ? 'P1Y' : 'P1M',
                description: plan.description,
                availability: 'https://schema.org/InStock'
            }))
        ],
        category: 'Financial Software',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150'
        },
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'EWA withdrawal flat fee',
                value: `${feeSchedule.currency} ${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)}`,
            },
            {
                '@type': 'PropertyValue',
                name: 'Social contribution fee',
                value: formatRate(feeSchedule.social_contribution_fee_rate),
            },
            {
                '@type': 'PropertyValue',
                name: 'Payout fee rate (Free)',
                value: formatRate(feeSchedule.payout_fee_rates.free),
            },
            {
                '@type': 'PropertyValue',
                name: 'Payout fee rate (Pro)',
                value: formatRate(feeSchedule.payout_fee_rates.pro),
            },
        ],
    };

    const serviceStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Payment Processing Services',
        description: 'Payment support for stablecoins, mobile money, bank transfers, and cards.',
        provider: {
            '@type': 'Organization',
            name: 'Corridor'
        },
        serviceType: 'Payment Processing',
        areaServed: ['Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Global'],
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'Live EWA withdrawal fee',
                value: `${feeSchedule.currency} ${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)}`,
            },
            {
                '@type': 'PropertyValue',
                name: 'Live social goals fee',
                value: formatRate(feeSchedule.social_contribution_fee_rate),
            },
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Payment Services',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Stablecoin Processing',
                        description: 'USDC, USDT, cUSD processing with instant settlement'
                    },
                    price: '0.1',
                    priceCurrency: 'USD'
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Mobile Money Processing',
                        description: 'M-PESA, Airtel, MTN processing'
                    },
                    price: '1.0',
                    priceCurrency: 'USD'
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Bank Transfer Processing',
                        description: 'Local & SWIFT bank transfers'
                    },
                    price: '0.5',
                    priceCurrency: 'USD'
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Card Processing',
                        description: 'Visa, Mastercard processing'
                    },
                    price: '2.9',
                    priceCurrency: 'USD'
                }
            ]
        }
    };

    return (
        <>
            <SEO 
                structuredData={[pricingStructuredData, serviceStructuredData]}
                ogType="product"
                ogImage="/corridor-pricing.jpg"
            />
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
            <div className="relative overflow-hidden py-20 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-orange-500/20 blur-3xl opacity-30 animate-pulse-slow"></div>
                    <div className="absolute top-40 -left-20 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-3xl opacity-30 animate-float-slow"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
                        Simple pricing that grows with your team <span className="text-orange-500">as you grow</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Clear monthly or yearly plans, plus transparent transaction fees. No hidden costs.
                    </p>
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 shadow-sm">
                        {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
                                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                                    billingCycle === cycle
                                        ? (cycle === 'yearly' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/20')
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing'}
                            </button>
                        ))}
                    </div>
                    <p className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
                        billingCycle === 'yearly' ? 'border-orange-200 bg-orange-500/10 text-orange-400' : 'border-indigo-200 bg-indigo-500/10 text-indigo-400'
                    }`}>
                        <span className="inline-block h-2 w-2 rounded-full bg-current animate-pulse" />
                        {billingCycle === 'yearly' ? 'Yearly plan on' : 'Monthly plan on'}
                    </p>
                </div>
            </div>

            {/* Platform Tiers */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {CANONICAL_PRICING_CATALOG.map((plan) => (
                        <div
                            key={plan.slug}
                            className={`rounded-2xl p-8 flex flex-col relative transition-all border ${billingCycle === 'yearly'
                                ? 'ring-1 ring-orange-400/20'
                                : 'ring-1 ring-cyan-400/20'
                                } ${plan.popular
                                ? `bg-orange-500/10 border-orange-500 ${cycleTone.wrapper}`
                                : `bg-white/5 border-white/10 ${billingCycle === 'yearly' ? 'hover:border-orange-400/40' : 'hover:border-cyan-400/40'}`
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-4">
                                <h3 className={`text-xl font-bold ${plan.popular ? 'text-orange-500' : 'text-white'}`}>{plan.name}</h3>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{getPlanPrice(plan, billingCycle)}</span>
                                <span className="text-gray-500">{getPlanPeriodLabel(billingCycle)}</span>
                            </div>
                            <div className="mb-6">
                                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${billingCycle === 'yearly'
                                    ? 'border-orange-400/30 bg-orange-500/10 text-orange-200'
                                    : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                                    }`}>
                                    <span className="inline-block h-2 w-2 rounded-full bg-current" />
                                    {billingCycle} pricing shown
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    savePendingUpgradePlan(plan.slug);
                                    const target = isAuthenticated
                                        ? '/subscription'
                                        : `/onboarding?context=${btoa(JSON.stringify({ plan: plan.slug, source: 'pricing' }))}`;
                                    navigate(target);
                                }}
                                className={`w-full py-3 rounded-xl transition-colors font-semibold text-center mb-8 ${plan.popular
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-white/10 hover:bg-white/20'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                            <ul className="space-y-4 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className={`w-5 h-5 ${plan.popular ? 'text-orange-500' : 'text-green-500'} flex-shrink-0`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction Fees */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <h2 className="text-3xl font-bold text-center mb-12">Transaction Fees (The Rails)</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stablecoins */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Stablecoins</h3>
                        <p className="text-sm text-gray-400 mb-4">USDC, USDT, cUSD</p>
                        <div className="text-3xl font-bold text-white mb-1">0.1%</div>
                        <p className="text-xs text-gray-500 mb-6">Capped at $1 per transaction</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Instant Settlement</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Global Reach</li>
                        </ul>
                    </div>

                    {/* Mobile Money */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Smartphone className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Mobile Money</h3>
                        <p className="text-sm text-gray-400 mb-4">M-PESA, Airtel, MTN</p>
                        <div className="text-3xl font-bold text-white mb-1">1.0%</div>
                        <p className="text-xs text-gray-500 mb-6">For payouts & collections</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 99.9% Uptime</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Automated Reconciliation</li>
                        </ul>
                    </div>

                    {/* Bank Transfers */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                            <Building className="w-6 h-6 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Bank Transfers</h3>
                        <p className="text-sm text-gray-400 mb-4">Local & SWIFT</p>
                        <div className="text-3xl font-bold text-white mb-1">0.5%</div>
                        <p className="text-xs text-gray-500 mb-6">Min $0.50, Max $50</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> High Value Support</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Multi-currency Accounts</li>
                        </ul>
                    </div>

                    {/* Card Processing */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-colors">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                            <CreditCard className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Cards</h3>
                        <p className="text-sm text-gray-400 mb-4">Visa, Mastercard</p>
                        <div className="text-3xl font-bold text-white mb-1">2.9%</div>
                        <p className="text-xs text-gray-500 mb-6">+ $0.30 per transaction</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Global Acceptance</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Fraud Protection</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Live Fee Schedule */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-3xl font-bold">Live fee schedule</h2>
                        <p className="text-gray-400 mt-2">
                            Rendered from the backend so pricing copy stays aligned with enforcement.
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        {feeError ? 'Showing backup pricing data' : `Live pricing loaded in ${feeSchedule.currency}`}
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { label: 'Free', rate: feeSchedule.payout_fee_rates.free },
                        { label: 'Pro', rate: feeSchedule.payout_fee_rates.pro },
                        { label: 'Premium', rate: feeSchedule.payout_fee_rates.premium },
                        { label: 'Enterprise', rate: feeSchedule.payout_fee_rates.enterprise },
                    ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <p className="text-sm text-gray-400">{item.label}</p>
                            <p className="text-3xl font-bold text-white mt-2">{formatRate(item.rate)}</p>
                            <p className="text-xs text-gray-500 mt-2">Platform payout fee rate</p>
                        </div>
                    ))}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                        <p className="text-sm text-gray-300">EWA withdrawal fee</p>
                        <p className="text-3xl font-bold text-white mt-2">${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)}</p>
                        <p className="text-xs text-gray-300 mt-2">{feeSchedule.ewa_withdrawal_unit}</p>
                    </div>
                    <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
                        <p className="text-sm text-gray-300">Social goals fee</p>
                        <p className="text-3xl font-bold text-white mt-2">{formatRate(feeSchedule.social_contribution_fee_rate)}</p>
                        <p className="text-xs text-gray-300 mt-2">Charged on gross contributions</p>
                    </div>
                </div>
            </div>

            {/* Priority Plays */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Priority A</p>
                                <h3 className="text-2xl font-bold text-white">B2B Play: Earned Wage Access</h3>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-4">
                            Target companies with 50+ employees. Corridor monetizes the subscription plus a flat withdrawal fee on each advance.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-black/20 p-4 border border-white/10">
                                <p className="text-sm text-gray-400">Subscription</p>
                                <p className="text-2xl font-bold text-white">Payday Pro</p>
                                <p className="text-sm text-gray-400">Controls access to EWA, API, and payroll tooling</p>
                            </div>
                            <div className="rounded-2xl bg-black/20 p-4 border border-white/10">
                                <p className="text-sm text-gray-400">Withdrawal Fee</p>
                                <p className="text-2xl font-bold text-white">${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)}</p>
                                <p className="text-sm text-gray-400">Flat fee per EWA withdrawal, no hidden percentage</p>
                            </div>
                        </div>
                        <p className="text-xs text-emerald-200/80 mt-4">
                            This is enforced in the backend when an employee requests an advance, and it appears in the request record as `fee_charged`.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center">
                                <Workflow className="w-6 h-6 text-fuchsia-300" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/80">Priority B</p>
                                <h3 className="text-2xl font-bold text-white">Social Goals: Crowdfunding</h3>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-4">
                            Great for creators and communities. Each contribution has a 1% platform fee.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-black/20 p-4 border border-white/10">
                                <p className="text-sm text-gray-400">Contribution Fee</p>
                                <p className="text-2xl font-bold text-white">{formatRate(feeSchedule.social_contribution_fee_rate)}</p>
                                <p className="text-sm text-gray-400">Charged on the gross contribution amount</p>
                            </div>
                            <div className="rounded-2xl bg-black/20 p-4 border border-white/10">
                                <p className="text-sm text-gray-400">Goal Growth</p>
                                <p className="text-2xl font-bold text-white">Gross credited</p>
                                <p className="text-sm text-gray-400">Campaign totals stay transparent even when fees are deducted</p>
                            </div>
                        </div>
                        <p className="text-xs text-fuchsia-200/80 mt-4">
                            The backend stores the fee in each transaction record so reporting and payouts stay auditable.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-orange-600 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to simplify your payments?</h2>
                    <p className="text-xl text-white/90 mb-8">Join teams using Corridor to run day-to-day payments with confidence.</p>
                    <Link to="/onboarding" className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
                        Start for Free <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default Pricing;
