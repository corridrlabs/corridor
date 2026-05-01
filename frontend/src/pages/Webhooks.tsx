import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { accountApi } from '../api/account';
import { GenericPageSkeleton } from '../components/ui/Skeletons';

interface Webhook {
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    created_at: string;
    secret?: string;
}

export const Webhooks = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newWebhook, setNewWebhook] = useState({
        url: '',
        events: ['payment.success', 'payment.failed']
    });

    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        setLoading(true);
        try {
            const data = await accountApi.getWebhooks();
            setWebhooks(data);
        } catch (error) {
            console.error('Failed to load webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const response = await accountApi.createWebhook(newWebhook);
            setWebhooks([...webhooks, response]);
            setShowNewModal(false);
            setNewWebhook({ url: '', events: ['payment.success', 'payment.failed'] });
        } catch (error) {
            console.error('Failed to create webhook:', error);
        }
    };

    const handleDelete = async (webhookId: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;

        try {
            await accountApi.deleteWebhook(webhookId);
            setWebhooks(webhooks.filter(w => w.id !== webhookId));
        } catch (error) {
            console.error('Failed to delete webhook:', error);
        }
    };

    const availableEvents = [
        { value: 'payment.success', label: 'Payment Success' },
        { value: 'payment.failed', label: 'Payment Failed' },
        { value: 'payment.pending', label: 'Payment Pending' },
        { value: 'refund.created', label: 'Refund Created' },
    ];

    if (loading) {
        return <GenericPageSkeleton cardRows={6} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
                    <p className="text-gray-500">Configure webhooks to receive real-time payment updates.</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Webhook
                </button>
            </div>

            {webhooks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">No webhooks configured. Add one to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{webhook.url}</h3>
                                        <a
                                            href={webhook.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {webhook.events.map((event) => (
                                            <span
                                                key={event}
                                                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                                            >
                                                {event}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="text-sm text-gray-500">
                                        Created {new Date(webhook.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDelete(webhook.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Webhook Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Webhook</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={newWebhook.url}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://example.com/webhook"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Events to Subscribe
                                </label>
                                <div className="space-y-2">
                                    {availableEvents.map((event) => (
                                        <label key={event.value} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newWebhook.events.includes(event.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewWebhook({
                                                            ...newWebhook,
                                                            events: [...newWebhook.events, event.value]
                                                        });
                                                    } else {
                                                        setNewWebhook({
                                                            ...newWebhook,
                                                            events: newWebhook.events.filter(ev => ev !== event.value)
                                                        });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{event.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newWebhook.url || newWebhook.events.length === 0}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Webhook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
