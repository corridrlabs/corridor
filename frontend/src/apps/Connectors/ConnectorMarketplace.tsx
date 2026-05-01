import React, { useState, useEffect } from 'react';
import { Search, Download, Check, Settings, X, ExternalLink } from 'lucide-react';
import { withApiPath } from '../../config/env';

interface Connector {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    downloads: number;
    rating: number;
    featured: boolean;
    price: string;
    actions: string[];
}

interface Installation {
    installation_id: string;
    connector_id: string;
    version: string;
    status: string;
}

const ConnectorMarketplace: React.FC = () => {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [installedConnectors, setInstalledConnectors] = useState<Installation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const categories = ['all', 'payment', 'communication', 'hr', 'accounting', 'other'];

    useEffect(() => {
        fetchConnectors();
        fetchInstalledConnectors();
    }, [selectedCategory]);

    const fetchConnectors = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);

            const response = await fetch(`${withApiPath('/connectors')}?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setConnectors(data);
            }
        } catch (error) {
            console.error('Failed to fetch connectors', error);
        }
    };

    const fetchInstalledConnectors = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath('/connectors/installed/list'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setInstalledConnectors(data);
            }
        } catch (error) {
            console.error('Failed to fetch installed connectors', error);
        }
    };

    const isInstalled = (connectorId: string) => {
        return installedConnectors.some(inst => inst.connector_id === connectorId);
    };

    const handleInstall = async () => {
        if (!selectedConnector) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath('/connectors/install'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connector_id: selectedConnector.id,
                    config: config
                })
            });

            if (response.ok) {
                await fetchInstalledConnectors();
                setShowConfigModal(false);
                setConfig({});
            }
        } catch (error) {
            console.error('Installation failed', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConnectors = connectors.filter(connector =>
        connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connector.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Connector Marketplace</h1>
                <p className="text-gray-600">Discover and install integrations to extend Corridor</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search connectors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Connector Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConnectors.map(connector => (
                        <div key={connector.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-1">{connector.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{connector.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="px-2 py-1 bg-gray-100 rounded">{connector.category}</span>
                                        <span>v{connector.version}</span>
                                        <span>★ {connector.rating}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Download className="w-4 h-4" />
                                    {connector.downloads.toLocaleString()}
                                </div>
                                {isInstalled(connector.id) ? (
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Installed
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedConnector(connector);
                                            setShowConfigModal(true);
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                                    >
                                        Install
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Config Modal */}
            {showConfigModal && selectedConnector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Configure {selectedConnector.name}</h2>
                            <button onClick={() => setShowConfigModal(false)}>
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={config.api_key || ''}
                                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter API key"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Webhook URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={config.webhook_url || ''}
                                    onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInstall}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Installing...' : 'Install'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectorMarketplace;
