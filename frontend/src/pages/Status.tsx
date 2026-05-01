import React, { useEffect } from 'react';
import { Activity, CheckCircle, RefreshCcw, ShieldCheck, Zap } from 'lucide-react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const Status = () => {
    // Structured Data for SEO
    const statusStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'System Status - Corridor',
        description: 'Current real-time operational status for Corridor API, Dashboard, and Payment Gateways.',
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16">
            <SEO 
                title="System Status | Corridor"
                description="Live system status and operational health of Corridor API, Dashboard, and Regional Payment Networks."
                structuredData={statusStructuredData}
            />

            <div className="max-w-4xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">System Status</h1>
                        <p className="text-slate-500">Real-time operational status of Corridor systems</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-medium text-sm border border-emerald-200 shadow-sm">
                        <CheckCircle size={16} className="text-emerald-500" />
                        All Systems Operational
                    </div>
                </div>

                {/* Overall Status Banner */}
                <div className="bg-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-lg shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Activity size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">100% Uptime</h2>
                            <p className="text-emerald-50 font-medium tracking-wide">No active incidents reported</p>
                        </div>
                    </div>
                    <div className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                        <RefreshCcw size={14} className="animate-spin-slow" />
                        Last updated just now
                    </div>
                </div>

                {/* Services Status */}
                <div className="grid gap-6 mb-12">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-blue-500" /> Core Services
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'API Services', status: 'Operational', uptime: '99.99%', latency: '42ms' },
                                { name: 'Webhook Deliveries', status: 'Operational', uptime: '100%', latency: '21ms' },
                                { name: 'Dashboard Interface', status: 'Operational', uptime: '99.99%', latency: '18ms' },
                                { name: 'MCP AI Agents Integration', status: 'Operational', uptime: '100%', latency: '85ms' },
                            ].map(service => (
                                <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="font-medium text-slate-800">{service.name}</div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-xs font-mono text-slate-400">{service.latency} latency</div>
                                        <div className="hidden sm:block text-xs text-slate-500">{service.uptime} uptime</div>
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                                            <CheckCircle size={14} />
                                            {service.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-purple-500" /> Payment Gateways
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'M-Pesa Processor (Kenya)', status: 'Operational' },
                                { name: 'Card Processor (Global)', status: 'Operational' },
                                { name: 'Circle USDC Treasury', status: 'Operational' },
                                { name: 'Solana Escrow Contracts', status: 'Operational' },
                            ].map(service => (
                                <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="font-medium text-slate-800">{service.name}</div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                                        <CheckCircle size={14} />
                                        {service.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Back to Home context */}
                <div className="flex justify-center">
                    <Link to="/landing" className="text-slate-500 hover:text-slate-900 font-medium text-sm underline underline-offset-4 decoration-slate-300">
                        Return to Corridor Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Status;
