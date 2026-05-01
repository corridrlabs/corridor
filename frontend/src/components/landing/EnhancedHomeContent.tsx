import React, { useState } from 'react';
import { ArrowRight, Zap, Activity, BarChart3, Workflow, Users, FileText, Webhook, Shield, DollarSign, CreditCard, TrendingUp, Sparkles, Check, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { platformCapabilities, useCases, whyCorridor, pricingPhilosophy } from '../../data/landing-data';
import { Carousel, CarouselSlide } from '../ui/Carousel';

const iconMap: Record<string, any> = {
    Zap,
    Activity,
    BarChart3,
    Workflow,
    Users,
    FileText,
    Webhook,
    Shield,
    DollarSign,
    CreditCard,
    TrendingUp
};

export const EnhancedHomeContent: React.FC = () => {
    const navigate = useNavigate();
    const [showDemoModal, setShowDemoModal] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
                <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:32px_32px]"></div>
                {/* Subtle decorative elements */}
                <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-5 animate-fadeIn text-slate-900">
                            The complete platform for{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                business orchestration
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-7">
                            Payments, analytics, automation, and team collaboration — all in one unified platform
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/onboarding')}
                                className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                Start Orchestrating
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowDemoModal(true)}
                                className="px-7 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                            >
                                <Play className="w-5 h-5" />
                                Watch Demo
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mt-4">
                            Questions? <a href="#" className="underline hover:text-slate-900 font-medium">Talk to a human</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Preview */}
            <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Your Future Dashboard</h2>
                    <p className="text-xl text-slate-600">A complete OS for business orchestration</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                    <Carousel
                        autoplay={true}
                        autoplaySpeed={4000}
                        slidesToShow={1}
                        dots={true}
                        arrows={true}
                        className="rounded-lg overflow-hidden"
                    >
                        {/* Sales Dashboard */}
                        <CarouselSlide>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-8 h-8 text-white" />
                                        <span className="text-white font-bold text-lg">Sales Dashboard</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Real-time</span>
                                </div>
                                <div className="p-6 grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                                        <div className="text-sm text-slate-600 mb-2">Total Revenue</div>
                                        <div className="text-3xl font-bold text-slate-900">KES 2.5M</div>
                                        <div className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>↑ 23.5%</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                        <div className="text-sm text-slate-600 mb-2">Transactions</div>
                                        <div className="text-3xl font-bold text-slate-900">12,458</div>
                                        <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>↑ 18.2%</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-200">
                                        <div className="text-sm text-slate-600 mb-2">Active Users</div>
                                        <div className="text-3xl font-bold text-slate-900">3,456</div>
                                        <div className="text-sm text-violet-600 mt-2 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>↑ 31.8%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselSlide>

                        {/* Operations Dashboard */}
                        <CarouselSlide>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-8 h-8 text-white" />
                                        <span className="text-white font-bold text-lg">Operations Dashboard</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Live</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                        <div className="text-sm text-slate-600 mb-2">Workflows Running</div>
                                        <div className="text-3xl font-bold text-slate-900">142</div>
                                        <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                                            <Zap className="w-4 h-4" />
                                            <span>Active now</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                                        <div className="text-sm text-slate-600 mb-2">Success Rate</div>
                                        <div className="text-3xl font-bold text-slate-900">98.5%</div>
                                        <div className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                                            <Check className="w-4 h-4" />
                                            <span>24h avg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselSlide>

                        {/* Financial Dashboard */}
                        <CarouselSlide>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-8 h-8 text-white" />
                                        <span className="text-white font-bold text-lg">Financial Dashboard</span>
                                    </div>
                                    <span className="text-white/80 text-sm">Overview</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-200">
                                        <div className="text-sm text-slate-600 mb-2">Cash Balance</div>
                                        <div className="text-3xl font-bold text-slate-900">KES 1.2M</div>
                                        <div className="text-sm text-violet-600 mt-2 flex items-center gap-1">
                                            <Shield className="w-4 h-4" />
                                            <span>Secured</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                        <div className="text-sm text-slate-600 mb-2">Monthly Burn</div>
                                        <div className="text-3xl font-bold text-slate-900">KES 450K</div>
                                        <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                                            <BarChart3 className="w-4 h-4" />
                                            <span>On track</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselSlide>
                    </Carousel>
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/verify-os')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg inline-flex items-center gap-2"
                        >
                            Try it yourself
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product OS Showcase */}
            <div className="bg-slate-50 py-16 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">Built-in, Product OS ships with:</h2>
                        <p className="text-lg text-slate-600">Everything you need in one platform</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {platformCapabilities.productOS.features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                                <h3 className="font-semibold text-slate-900 text-base mb-2">{feature.name}</h3>
                                <p className="text-slate-600 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Platform Capabilities */}
            <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
                <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Platform Capabilities</h2>
                <div className="space-y-10">
                    {Object.entries(platformCapabilities).slice(1).map(([key, category]) => (
                        <div key={key} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="mb-5">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title}</h3>
                                <p className="text-slate-600 text-sm">{category.description}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                {category.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 text-sm">{feature.name}</h4>
                                            <p className="text-xs text-slate-600">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Use Cases */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 py-16 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Explore apps by company stage</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {Object.entries(useCases).map(([key, useCase]) => (
                            <div key={key} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                                <p className="text-slate-600 text-sm mb-4">{useCase.description}</p>
                                <ul className="space-y-2">
                                    {useCase.benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-2 text-slate-700 text-sm">
                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">{pricingPhilosophy.title}</h2>
                    <p className="text-lg text-slate-600">{pricingPhilosophy.description}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {pricingPhilosophy.tiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`rounded-xl border-2 p-6 ${tier.highlight
                                    ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                                    : 'border-slate-200 bg-white'
                                }`}
                        >
                            {tier.highlight && (
                                <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                                    MOST POPULAR
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-slate-900">
                                    {tier.price === 'Free' ? tier.price : `${tier.currency} ${tier.price}`}
                                </span>
                                {tier.price !== 'Free' && (
                                    <span className="text-slate-600 text-sm ml-2">/{tier.period.split(' ')[1]}</span>
                                )}
                            </div>
                            <p className="text-slate-600 text-sm mb-6">{tier.description}</p>
                            <ul className="space-y-3 mb-6">
                                {tier.limits.map((limit, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-700 text-sm">{limit}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${tier.highlight
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                    }`}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-slate-600">{pricingPhilosophy.note}</p>
            </div>

            {/* AI & Innovation Features */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 border-y border-blue-700">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <Sparkles className="w-12 h-12 mx-auto mb-3" />
                        <h2 className="text-3xl font-bold mb-3">AI that speaks the language of your business</h2>
                        <p className="text-lg text-blue-100">
                            Upcoming Corridor AI features turn raw data into clear decisions for founders, finance teams, HR, and operators.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <h3 className="font-semibold text-lg mb-2">AI Financial Assistant</h3>
                            <p className="text-blue-100 text-sm">
                                Ask natural questions like "How much did we make last month?" and get plain-language answers plus charts.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <h3 className="font-semibold text-lg mb-2">Smart EWA Limits</h3>
                            <p className="text-blue-100 text-sm">
                                ML-powered recommendations for safe EWA limits per employee based on salary, tenure, and repayment history.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <h3 className="font-semibold text-lg mb-2">Automated Compliance Checker</h3>
                            <p className="text-blue-100 text-sm">
                                Real-time checks for Kenyan regulations (KRA, NSSF, NHIF) and EWA rules, with alerts when something looks off.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <h3 className="font-semibold text-lg mb-2">Business Health Score</h3>
                            <p className="text-blue-100 text-sm">
                                A single score combining revenue, cash flow, and workforce signals, with trends and recommendations.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                            <h3 className="font-semibold text-lg mb-2">Collaborative Budgeting</h3>
                            <p className="text-blue-100 text-sm">
                                Department-level budgets, approvals, and variance alerts so teams can plan together and stay on track.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Corridor */}
            <div className="max-w-7xl mx-auto px-6 py-16 bg-white">
                <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Why Corridor?</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {whyCorridor.map((reason, index) => (
                        <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{reason.title}</h3>
                            <p className="text-slate-700 text-sm mb-3">{reason.description}</p>
                            <a href={reason.link} className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1">
                                Learn more
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 border-y border-blue-700">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to start orchestrating?</h2>
                    <p className="text-lg text-blue-100 mb-6">
                        Join thousands of teams building better products with Corridor
                    </p>
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:shadow-xl transition-all border-2 border-white"
                    >
                        Get Started Free
                    </button>
                </div>
            </div>

            {/* Demo Modal */}
            {showDemoModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Product Demo</h3>
                            <button
                                onClick={() => setShowDemoModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                            <p className="text-gray-500">Video demo coming soon</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowDemoModal(false);
                                    navigate('/verify-os');
                                }}
                                className="flex-1 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all"
                            >
                                Try Interactive Demo
                            </button>
                            <button
                                onClick={() => setShowDemoModal(false)}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
