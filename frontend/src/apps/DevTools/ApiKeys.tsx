import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertTriangle, X as XIcon } from 'lucide-react';
import api from '../../services/api';

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    last_used_at: string | null;
}

const ApiKeys: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const fetchKeys = async () => {
        try {
            const response = await api.get('/developer/keys');
            setKeys(response.data);
        } catch (error) {
            console.error("Failed to fetch keys", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleCreateKey = async () => {
        setCreating(true);
        try {
            const response = await api.post('/developer/keys', { name: 'New Key' });
            setNewKey(response.data.secret);
            fetchKeys();
        } catch (error) {
            console.error("Failed to create key", error);
            alert("Failed to create API key");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
            try {
                await api.delete(`/developer/keys/${id}`);
                setKeys(keys.filter(k => k.id !== id));
            } catch (error) {
                console.error("Failed to delete key", error);
                alert("Failed to revoke API key");
            }
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                    <p className="text-gray-500">Manage your secret keys for accessing the Corridor API.</p>
                </div>
                <button
                    onClick={handleCreateKey}
                    disabled={creating}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    {creating ? 'Creating...' : 'Create New Key'}
                </button>
            </div>

            {newKey && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <Key className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-green-900 mb-1">New API Key Created</h3>
                            <p className="text-sm text-green-700 mb-3">
                                Please copy this key now. You won't be able to see it again!
                            </p>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-3">
                                <code className="flex-1 font-mono text-sm text-gray-800">{newKey}</code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(newKey)}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setNewKey(null)} className="text-green-500 hover:text-green-700">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Token</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Used</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading keys...</td></tr>
                        ) : keys.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No API keys found. Create one to get started.</td></tr>
                        ) : (
                            keys.map(key => (
                                <tr key={key.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{key.name}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{key.prefix}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(key.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {key.last_used_at ? (
                                            new Date(key.last_used_at).toLocaleDateString()
                                        ) : (
                                            <span className="text-gray-400 italic">Never</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(key.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Revoke Key"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                    <h4 className="font-medium text-amber-900">Security Note</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        Never share your API keys. If you suspect a key has been compromised, revoke it immediately.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeys;
