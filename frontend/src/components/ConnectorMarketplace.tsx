import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Package,
    Download,
    Star,
    TrendingUp,
    Globe,
    DollarSign,
    Workflow,
    Plus,
    Zap,
    Code,
    Database,
    Mail,
    UserPlus,
    Clock,
    ArrowRight,
} from 'lucide-react';
import { connectorsApi } from '../api/connectors';
import { ConnectorSkeleton } from './ui/Skeleton';

interface ConnectorMarketplaceProps {
    organizationId: string;
}

export const ConnectorMarketplace: React.FC<ConnectorMarketplaceProps> = ({ organizationId }) => {
    const { projectId } = useParams<{ projectId?: string }>();
    const navigate = useNavigate();
    const [connectors, setConnectors] = useState<any[]>([]);
    const [installed, setInstalled] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'popular' | 'installed' | 'automations'>('all');
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [statusError, setStatusError] = useState<string>('');

    useEffect(() => {
        fetchConnectors();
        fetchInstalled();
    }, [organizationId]);

    const fetchConnectors = async () => {
        setLoading(true);
        try {
            const data = await connectorsApi.getMarketplace();
            setConnectors(data.connectors || []);
        } catch (error) {
            console.error('Failed to fetch connectors:', error);
            setConnectors([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstalled = async () => {
        try {
            const data = await connectorsApi.getInstalled(organizationId);
            setInstalled(new Set(data.map((c: any) => c.id)));
        } catch (error) {
            console.error('Failed to fetch installed connectors:', error);
        }
    };

    const installConnector = async (connectorId: string, version: string) => {
        try {
            setStatusError('');
            await connectorsApi.install({ connector_id: connectorId, version, organization_id: organizationId });
            await fetchInstalled();
            setStatusMessage('Connector installed successfully.');
        } catch (error) {
            console.error('Failed to install connector:', error);
            setStatusError('Failed to install connector. Please try again.');
        }
    };

    const uninstallConnector = async (connectorId: string) => {
        try {
            setStatusError('');
            await connectorsApi.uninstall({ connector_id: connectorId, organization_id: organizationId });
            await fetchInstalled();
            setStatusMessage('Connector removed from this workspace.');
        } catch (error) {
            console.error('Failed to uninstall connector:', error);
            setStatusError('Failed to remove connector. Please try again.');
        }
    };

    const handleCreateWorkflow = () => {
        if (projectId) {
            navigate(`/project/${projectId}/workflows`);
        } else {
            navigate(`/workflows`);
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
            ),
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
            ),
        },
        {
            id: 'payment-webhook',
            title: 'Payment webhook',
            description: 'Automate actions when payments are received or failed.',
            visual: (
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300">Payment</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                        <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-indigo-700 dark:text-indigo-300">Trigger Workflow</span>
                    </div>
                </div>
            ),
        },
        {
            id: 'data-sync',
            title: 'Data synchronization',
            description: 'Sync data between connectors and keep everything in sync.',
            visual: (
                <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-blue-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Database className="w-4 h-4 text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Database className="w-4 h-4 text-purple-600" />
                </div>
            ),
        },
    ];

    const filteredConnectors = connectors.filter((c) => {
        if (filter === 'installed') return installed.has(c.id);
        if (filter === 'popular') return c.is_published;
        if (filter === 'automations') return false; // handled separately
        return true;
    });

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse" />
                    </h1>
                    <div className="h-5 w-96 bg-gray-200 rounded-lg animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ConnectorSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations & Automations</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Connect apps, build workflows, and automate your business processes
                    </p>
                </div>
            </div>
            {(statusMessage || statusError) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${statusError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    {statusError || statusMessage}
                </div>
            )}

            {/* Automation CTA Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <Workflow className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Build workflows and automate without code
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Create automated workflows that connect your apps and services. Set up triggers, actions, and rules to automate your business processes.
                    </p>

                    <button
                        onClick={handleCreateWorkflow}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Workflow
                    </button>
                </div>
            </div>

            {/* Automation Templates */}
            {(filter === 'all' || filter === 'automations') && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Popular Workflow Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {automationTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={handleCreateWorkflow}
                            >
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {template.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {template.description}
                                </p>
                                <div className="mt-4">{template.visual}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Connectors Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Connectors</h3>
                    <div className="flex gap-2">
                        {['all', 'popular', 'installed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm ${filter === f
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredConnectors.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'installed'
                                ? 'No connectors installed yet. Install one to get started.'
                                : 'No connectors available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConnectors.map((connector) => (
                            <div
                                key={connector.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                            <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{connector.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">v{connector.latest_version || '1.0.0'}</p>
                                        </div>
                                    </div>
                                    {installed.has(connector.id) && (
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded">
                                            Installed
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                                    {connector.description || 'No description available'}
                                </p>

                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    {connector.supported_countries && (
                                        <div className="flex items-center gap-1">
                                            <Globe size={16} />
                                            <span>{connector.supported_countries.length} countries</span>
                                        </div>
                                    )}
                                    {connector.supported_currencies && (
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={16} />
                                            <span>{connector.supported_currencies.length} currencies</span>
                                        </div>
                                    )}
                                </div>

                                {connector.supported_countries && connector.supported_countries.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {connector.supported_countries.slice(0, 3).map((country: string) => (
                                            <span
                                                key={country}
                                                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-800"
                                            >
                                                {country}
                                            </span>
                                        ))}
                                        {connector.supported_countries.length > 3 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                                +{connector.supported_countries.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!installed.has(connector.id) ? (
                                        <button
                                            onClick={() => installConnector(connector.id, connector.latest_version || '1.0.0')}
                                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Install
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => uninstallConnector(connector.id)}
                                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        Details
                                    </button>
                                </div>

                                {connector.revenue_share && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                        Revenue Share: {connector.revenue_share.developer_percentage}% to developer
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectorMarketplace;
