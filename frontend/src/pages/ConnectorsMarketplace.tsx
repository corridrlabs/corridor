import React from 'react';
import { Package, Plus, Settings, ExternalLink, CheckCircle, Clock } from 'lucide-react';

interface Connector {
    id: string;
    name: string;
    description: string;
    category: string;
    logo: string;
    status: 'installed' | 'available';
    lastSync?: string;
}

export const ConnectorsMarketplace: React.FC = () => {
    const connectors: Connector[] = [
        {
            id: 'xero',
            name: 'Xero',
            description: 'Sync invoices, payments, and accounting data',
            category: 'Accounting',
            logo: '📊',
            status: 'installed',
            lastSync: '2 hours ago'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Send notifications and alerts to your team',
            category: 'Communication',
            logo: '💬',
            status: 'installed',
            lastSync: '5 minutes ago'
        },
        {
            id: 'odoo',
            name: 'Odoo',
            description: 'Integrate with Odoo ERP for complete business management',
            category: 'ERP',
            logo: '🏢',
            status: 'available'
        },
        {
            id: 'quickbooks',
            name: 'QuickBooks',
            description: 'Sync financial data with QuickBooks Online',
            category: 'Accounting',
            logo: '💰',
            status: 'available'
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'Connect customer data and sales workflows',
            category: 'CRM',
            logo: '☁️',
            status: 'available'
        },
        {
            id: 'paystack',
            name: 'Paystack',
            description: 'Process card and bank payments across African markets',
            category: 'Payments',
            logo: '💳',
            status: 'installed',
            lastSync: '1 hour ago'
        }
    ];

    const installed = connectors.filter(c => c.status === 'installed');
    const available = connectors.filter(c => c.status === 'available');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Connectors Marketplace
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Plug-and-play integrations with your favorite tools
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{installed.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Installed</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{available.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">50+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Connectors</div>
                </div>
            </div>

            {/* Installed Connectors */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Installed Connectors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {installed.map((connector) => (
                        <div
                            key={connector.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">{connector.logo}</div>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{connector.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{connector.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                Last synced {connector.lastSync}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Available Connectors */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Available Connectors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {available.map((connector) => (
                        <div
                            key={connector.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow group"
                        >
                            <div className="text-4xl mb-4">{connector.logo}</div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{connector.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{connector.description}</p>
                            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" />
                                Install
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Connector */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Need a custom connector?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Build your own connector using our API or request a new integration
                </p>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View API Docs
                    </button>
                    <button className="px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                        Request Integration
                    </button>
                </div>
            </div>
        </div>
    );
};
