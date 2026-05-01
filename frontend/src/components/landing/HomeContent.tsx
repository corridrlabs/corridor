import React, { useState } from 'react';
import { ArrowRight, Zap, Activity, BarChart3, Workflow, Users, FileText, Webhook, Shield } from 'lucide-react';
import { waitlistApi } from '../../api/waitlist';

interface HomeContentProps {
    data: any;
}

const iconMap: Record<string, any> = {
    Zap,
    Activity,
    BarChart3,
    Workflow,
    Users,
    FileText,
    Webhook,
    Shield
};

const colorMap: Record<string, { light: string; border: string; icon: string }> = {
    blue: {
        light: 'from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        icon: 'bg-blue-600'
    },
    purple: {
        light: 'from-purple-50 to-pink-50',
        border: 'border-purple-200',
        icon: 'bg-purple-600'
    },
    orange: {
        light: 'from-orange-50 to-red-50',
        border: 'border-orange-200',
        icon: 'bg-orange-600'
    }
};

export const HomeContent: React.FC<HomeContentProps> = ({ data }) => {
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistCustomerType, setWaitlistCustomerType] = useState('Fintech builders');
    const [waitlistUseCase, setWaitlistUseCase] = useState('Cross-border payouts');
    const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

    const handleCTA = (action: string) => {
        if (action.startsWith('/')) {
            window.location.href = action;
        }
    };

    const submitWaitlist = async () => {
        setWaitlistStatus(null);
        try {
            await waitlistApi.join({
                name: waitlistCustomerType || 'Landing visitor',
                email: waitlistEmail,
                company: 'N/A',
                role: 'Unknown',
                target_customer: waitlistCustomerType,
                use_case: waitlistUseCase,
                channel: 'landing',
            });
            setWaitlistStatus('Joined! We will reach out soon.');
            setWaitlistEmail('');
        } catch (err: any) {
            setWaitlistStatus(err.message || 'Failed to join waitlist');
        }
    };

    return (
        <div className="p-8">
            {/* Hero Section */}
            <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                    {data.hero.heading.split(data.hero.highlightText)[0]}
                    <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                        {data.hero.highlightText}
                    </span>
                </h2>
                <p className="text-xs text-gray-600 mb-6 max-w-3xl">
                    {data.hero.description}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleCTA(data.hero.cta.primary.action)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                    >
                        {data.hero.cta.primary.text}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleCTA(data.hero.cta.secondary.action)}
                        className="px-3 py-1.5 border-2 border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:border-gray-400 transition-all"
                    >
                        {data.hero.cta.secondary.text}
                    </button>
                </div>
            </div>

            {/* Render Sections */}
            {data.sections.map((section: any, index: number) => {
                if (section.type === 'connectors') {
                    return (
                        <div key={index} className="mb-12">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {section.connectors.map((connector: any, itemIndex: number) => (
                                    <div key={itemIndex} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-semibold text-gray-900">{connector.name}</div>
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{connector.category}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">{connector.description}</p>
                                        <div className="text-[11px] text-gray-500">Workflows: {connector.workflows.join(', ')}</div>
                                    </div>
                                ))}
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Pre-built workflows</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                                {section.workflows.map((wf: any, wfIndex: number) => (
                                    <div key={wfIndex} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="text-sm font-semibold text-gray-900">{wf.title}</div>
                                        <p className="text-xs text-gray-600 mb-1">{wf.description}</p>
                                        <div className="text-[11px] text-gray-500">Channels: {wf.channels.join(', ')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                if (section.type === 'waiting_list') {
                    return (
                        <div key={index} className="mb-12">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h3>
                            <p className="text-sm text-gray-700 mb-4">{section.subtitle}</p>
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                {section.targetCustomers.map((customer: any, customerIndex: number) => (
                                    <div key={customerIndex} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                        <div className="text-sm font-semibold text-gray-900">{customer.title}</div>
                                        <p className="text-xs text-gray-600">{customer.description}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                {section.useCases.map((useCase: any, ucIndex: number) => (
                                    <div key={ucIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="text-sm font-semibold text-gray-900">{useCase.title}</div>
                                        <p className="text-xs text-gray-600">{useCase.description}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 flex flex-col md:flex-row gap-3 items-start md:items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-600">Work email</label>
                                    <input
                                        value={waitlistEmail}
                                        onChange={(e) => setWaitlistEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="you@company.com"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-600">Customer type</label>
                                    <select
                                        value={waitlistCustomerType}
                                        onChange={(e) => setWaitlistCustomerType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        {section.targetCustomers.map((c: any) => (
                                            <option key={c.title} value={c.title}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-xs text-gray-600">Use case</label>
                                    <select
                                        value={waitlistUseCase}
                                        onChange={(e) => setWaitlistUseCase(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        {section.useCases.map((u: any) => (
                                            <option key={u.title} value={u.title}>{u.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={submitWaitlist}
                                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold"
                                >
                                    Join waitlist
                                </button>
                            </div>
                            {waitlistStatus && <p className="text-xs text-gray-700 mt-2">{waitlistStatus}</p>}
                        </div>
                    );
                }

                if (section.type === 'features') {
                    return (
                        <div key={index} className="mb-12">
                            <h3 className="text-base font-bold text-gray-900 mb-6">{section.title}</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {section.items.map((item: any, itemIndex: number) => {
                                    const Icon = iconMap[item.icon];
                                    const colors = colorMap[item.color];
                                    return (
                                        <div key={itemIndex} className={`bg-gradient-to-br ${colors.light} p-6 rounded-lg border ${colors.border}`}>
                                            <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center mb-4`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                            <p className="text-xs text-gray-700">{item.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                if (section.type === 'capabilities') {
                    return (
                        <div key={index} className="mb-8">
                            <h3 className="text-base font-bold text-gray-900 mb-6">{section.title}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {section.items.map((item: any, itemIndex: number) => {
                                    const Icon = iconMap[item.icon];
                                    return (
                                        <div key={itemIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-10 h-10 bg-white rounded border border-gray-300 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-gray-700" />
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-gray-900 mb-0.5">{item.title}</h5>
                                                <p className="text-xs text-gray-600">{item.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};
