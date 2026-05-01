import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Workflow, 
    Plus, 
    UserPlus, 
    Code, 
    Database, 
    ArrowRight,
    Clock,
    Mail,
    Zap
} from 'lucide-react';

export const Automations: React.FC = () => {
    const { orgId, projectId } = useParams<{ orgId: string; projectId?: string }>();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreateAutomation = () => {
        if (projectId) {
            navigate(`/org/${orgId}/project/${projectId}/workflows`);
        } else {
            // Navigate to projects first to select one
            navigate(`/org/${orgId}/projects`);
        }
    };

    const automationTemplates = [
        {
            id: 'welcome-series',
            title: 'Welcome series',
            description: 'Auto-send an email sequence when a contact is created or added to a list.',
            visual: (
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-700 dark:text-blue-300">USER created</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                        <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300">Send Email</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-purple-700 dark:text-purple-300">Wait 2 Days</span>
                    </div>
                </div>
            )
        },
        {
            id: 'api-trigger',
            title: 'API event trigger',
            description: 'Trigger flows from your app just sending an API call.',
            visual: (
                <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className="text-center">
                        <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">PAYDAY API</span>
                    </div>
                </div>
            )
        },
        {
            id: 'onboarding',
            title: 'Onboarding guidance',
            description: 'Send the next step when a contact field updates (trial, plan, role, etc).',
            visual: (
                <div className="space-y-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Contact updates</div>
                    <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div className="text-xs text-center text-gray-600 dark:text-gray-400">TIER_PLAN updated</div>
                </div>
            )
        },
        {
            id: 'no-hardcode',
            title: 'No hardcode',
            description: 'Edit email content and flows without touching your app.',
            visual: (
                <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">
                    <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-semibold">Exclusive deals started</span>
                        <span className="text-gray-400">[from]</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                        <button className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">B</button>
                        <button className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">I</button>
                        <button className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">U</button>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <input type="checkbox" className="w-3 h-3" defaultChecked />
                            <span>Smart Text</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automations</h1>
            </div>

            {/* Central CTA Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <Workflow className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Save time and build email series without code.
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Use the workflow builder and Contacts to trigger and automate messages. Set up triggers, actions, and rules to automate your email workflows. Change content on the go.
                    </p>
                    
                    <div className="flex items-center justify-center gap-4">
                        <a 
                            href="#" 
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                            Learn more
                        </a>
                        <button
                            onClick={handleCreateAutomation}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Automation
                        </button>
                    </div>
                </div>
            </div>

            {/* Automation Templates */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Popular Automation Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {automationTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={handleCreateAutomation}
                        >
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {template.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {template.description}
                            </p>
                            <div className="mt-4">
                                {template.visual}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Connectors Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available Connectors
                    </h3>
                    <button
                        onClick={() => navigate(`/org/${orgId}/integrations`)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        View all connectors
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Connect your favorite apps and services to automate workflows across your entire stack.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Email', 'SMS', 'WhatsApp', 'Payment Gateways'].map((connector) => (
                        <div
                            key={connector}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer"
                            onClick={() => navigate(`/org/${orgId}/integrations`)}
                        >
                            <div className="text-center">
                                <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {connector}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
