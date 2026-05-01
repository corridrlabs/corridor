import React, { useState, useEffect } from 'react';
import { Plug, Check, X, Settings, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { connectorsService, Connector } from '../../services/connectors';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';

const PaymentConnectors: React.FC = () => {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchConnectors = async () => {
        try {
            const data = await connectorsService.getAll();
            setConnectors(data);
        } catch (error) {
            console.error('Failed to fetch connectors:', error);
            showToast('error', 'Failed to load payment connectors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnectors();
    }, []);

    const handleConnect = async (connector: Connector) => {
        setActionLoading(connector.id);
        try {
            // In a real app, this would open a modal or redirect to OAuth
            await connectorsService.update(connector.id, { status: 'connected' });
            showToast('success', `Connected to ${connector.name}`);
            fetchConnectors();
        } catch (error) {
            showToast('error', `Failed to connect to ${connector.name}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDisconnect = async (connector: Connector) => {
        if (!window.confirm(`Are you sure you want to disconnect ${connector.name}?`)) return;

        setActionLoading(connector.id);
        try {
            await connectorsService.update(connector.id, { status: 'disconnected' });
            showToast('success', `Disconnected ${connector.name}`);
            fetchConnectors();
        } catch (error) {
            showToast('error', `Failed to disconnect ${connector.name}`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Pending
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Not connected
                    </span>
                );
        }
    };

    // Helper to get logo (since backend might not return emoji)
    const getLogo = (id: string) => {
        const logos: Record<string, string> = {
            mpesa: '📱',
            paystack: '💳',
            flutterwave: '⚡',
            airtel_money: '📞'
        };
        return logos[id] || '🔌';
    };

    if (loading) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={300} />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                    </div>
                    <div className="space-y-4">
                        <Skeleton variant="rectangular" height={120} />
                        <Skeleton variant="rectangular" height={120} />
                        <Skeleton variant="rectangular" height={120} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Connectors</h1>
                        <p className="text-gray-600">Connect and manage your payment providers</p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchConnectors(); }}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-900">
                            {connectors.filter(c => c.status === 'connected').length}
                        </div>
                        <div className="text-sm text-gray-500">Connected</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-900">
                            {connectors.filter(c => c.status === 'pending').length}
                        </div>
                        <div className="text-sm text-gray-500">Pending</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-900">{connectors.length}</div>
                        <div className="text-sm text-gray-500">Total Available</div>
                    </div>
                </div>

                {/* Connectors Grid */}
                <div className="space-y-4">
                    {connectors.map((connector) => (
                        <div
                            key={connector.id}
                            className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {/* Logo */}
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                                    {getLogo(connector.id)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{connector.name}</h3>
                                        {getStatusBadge(connector.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {connector.provider} integration for Corridor OS
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {connector.status === 'connected' ? (
                                        <>
                                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium">
                                                <Settings className="w-4 h-4" />
                                                Configure
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(connector)}
                                                disabled={actionLoading === connector.id}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                            >
                                                {actionLoading === connector.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                                Disconnect
                                            </button>
                                        </>
                                    ) : connector.status === 'pending' ? (
                                        <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-2 text-sm font-medium">
                                            <ExternalLink className="w-4 h-4" />
                                            Complete Setup
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(connector)}
                                            disabled={actionLoading === connector.id}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                        >
                                            {actionLoading === connector.id ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Custom Connector */}
                <div className="mt-6 bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                    <Plug className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Need a custom connector?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        We can integrate with any payment provider
                    </p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        Request Integration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentConnectors;
