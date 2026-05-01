import React, { useState, useEffect } from 'react';
import { Plus, Copy, Eye, EyeOff, Trash2, Check } from 'lucide-react';
import { accountApi } from '../api/account';
import { TablePageSkeleton } from '../components/ui/Skeletons';

interface ApiKey {
    id: string;
    prefix: string;
    name?: string;
    is_active: boolean;
    created_at: string;
    last_used_at?: string;
    key?: string;
}

export const ApiKeys = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyData, setNewKeyData] = useState({ name: '', is_live: false });
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        setLoading(true);
        try {
            const data = await accountApi.getApiKeys();
            setKeys(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load API keys:', error);
            setKeys([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        try {
            const response = await accountApi.createApiKey(newKeyData);
            const created = (response && typeof response === 'object') ? response : null;
            setCreatedKey(created?.key || null);
            if (created?.id) {
                setKeys(prev => [...prev, created as ApiKey]);
            } else {
                await loadKeys();
            }
            setNewKeyData({ name: '', is_live: false });
        } catch (error) {
            console.error('Failed to create API key:', error);
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to revoke this API key?')) return;

        try {
            await accountApi.revokeApiKey(keyId);
            setKeys(keys.filter(k => k.id !== keyId));
        } catch (error) {
            console.error('Failed to revoke API key:', error);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return <TablePageSkeleton rows={7} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                    <p className="text-gray-500">Manage your API keys for accessing the Corridor API.</p>
                </div>
                <button
                    onClick={() => setShowNewKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Create API Key
                </button>
            </div>

            {keys.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">No API keys yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {keys.map((key) => (
                                <tr key={key.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{key.name || 'Unnamed'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <code className="text-gray-600">{key.prefix}••••••••</code>
                                            <button
                                                onClick={() => copyToClipboard(key.prefix + '••••••••', key.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {copiedId === key.id ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(key.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRevokeKey(key.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Key Modal */}
            {showNewKeyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create API Key</h3>

                        {createdKey ? (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 mb-2">
                                        ⚠️ Save this key now. You won't be able to see it again!
                                    </p>
                                    <div className="flex items-center gap-2 bg-white p-3 rounded border border-yellow-300">
                                        <code className="flex-1 text-sm break-all">{createdKey}</code>
                                        <button
                                            onClick={() => copyToClipboard(createdKey, 'new')}
                                            className="text-indigo-600 hover:text-indigo-800"
                                        >
                                            {copiedId === 'new' ? <Check size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowNewKeyModal(false);
                                        setCreatedKey(null);
                                    }}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Key Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newKeyData.name}
                                        onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="My API Key"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_live"
                                        checked={newKeyData.is_live}
                                        onChange={(e) => setNewKeyData({ ...newKeyData, is_live: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="is_live" className="text-sm text-gray-700">
                                        Live Mode (use for production)
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowNewKeyModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateKey}
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Create Key
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
