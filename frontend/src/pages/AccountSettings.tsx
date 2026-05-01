import React, { useState, useEffect } from 'react';
import { Building2, Save, Copy, Key, Webhook, Shield, FileText, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { accountApi } from '../api/account';
import { useAuthStore } from '../store/authStore';
import { useUpgradePrompt } from '../hooks/useUpgradePrompt';
import { UpgradePrompt } from '../components/UpgradePrompt';

type TabType = 'general' | 'security' | 'api-keys' | 'webhooks' | 'ewa';

export const AccountSettings: React.FC = () => {
    const { user, refreshUser } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [ewaRequests, setEwaRequests] = useState<any[]>([]);
    const [loadingEwa, setLoadingEwa] = useState(false);
    const [ewaSettings, setEwaSettings] = useState<any>(null);
    const { upgradePrompt, handleApiError, closeUpgradePrompt } = useUpgradePrompt();

    const [accountData, setAccountData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        whatsapp_phone: user?.whatsapp_phone || '',
        country: user?.country || 'KE',
        slug: 'default',
        callback_url: '',
    });

    const [ewaPolicyForm, setEwaPolicyForm] = useState({
        is_enabled: false,
        percentage_accessible: 0.5,
        max_withdrawal_per_period: 1000,
        transaction_fee: 10,
        cooldown_period_days: 7
    });

    useEffect(() => {
        if (user) {
            setAccountData({
                name: user.name || '',
                email: user.email || '',
                whatsapp_phone: user.whatsapp_phone || '',
                country: user.country || 'KE',
                slug: user.slug || 'default',
                callback_url: user.callback_url || '',
            });
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'api-keys') {
            fetchApiKeys();
        }
        if (activeTab === 'webhooks') {
            fetchWebhooks();
        }
        if (activeTab === 'ewa') {
            fetchEwaSettings();
            fetchEwaRequests();
        }
    }, [activeTab]);

    const fetchApiKeys = async () => {
        try {
            const keys = await accountApi.getApiKeys();
            setApiKeys(keys);
        } catch (err: any) {
            if (!handleApiError(err)) {
                const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to load API keys';
                setError(msg);
            }
        }
    };

    const fetchWebhooks = async () => {
        try {
            const hooks = await accountApi.getWebhooks();
            setWebhooks(hooks);
        } catch (err: any) {
            if (!handleApiError(err)) {
                const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to load webhooks';
                setError(msg);
            }
        }
    };

    const fetchEwaSettings = async () => {
        setLoadingEwa(true);
        try {
            const settings = await accountApi.getEWASettings();
            setEwaSettings(settings);
            if (settings) {
                setEwaPolicyForm({
                    is_enabled: settings.is_enabled,
                    percentage_accessible: settings.percentage_accessible,
                    max_withdrawal_per_period: settings.max_withdrawal_per_period,
                    transaction_fee: settings.transaction_fee,
                    cooldown_period_days: settings.cooldown_period_days
                });
            }
        } catch (err: any) {
            if (!handleApiError(err)) {
                console.error('Failed to fetch EWA settings:', err);
            }
        } finally {
            setLoadingEwa(false);
        }
    };

    const fetchEwaRequests = async () => {
        setLoadingEwa(true);
        try {
            const requests = await accountApi.getEWARequests();
            setEwaRequests(requests);
        } catch (err: any) {
            if (!handleApiError(err)) {
                console.error('Failed to fetch EWA requests:', err);
            }
        } finally {
            setLoadingEwa(false);
        }
    };



    const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAccountData(prev => ({ ...prev, [name]: value }));
    };

    const handleEwaPolicyChange = (name: string, value: any) => {
        setEwaPolicyForm(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleEwa = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoadingEwa(true);
        try {
            const newIsEnabled = e.target.checked;
            await accountApi.updateEWAPolicy({
                ...ewaPolicyForm,
                is_enabled: newIsEnabled
            });
            await fetchEwaSettings();
        } catch (err) {
            console.error('Failed to toggle EWA status:', err);
        } finally {
            setLoadingEwa(false);
        }
    };

    const handleSaveEwaPolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingEwa(true);
        try {
            await accountApi.updateEWAPolicy(ewaPolicyForm);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to update EWA policy:', err);
        } finally {
            setLoadingEwa(false);
        }
    };

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await accountApi.updateSettings(accountData);
            await refreshUser();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update account settings');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateApiKey = async () => {
        const name = prompt('Enter a name for your API key:');
        if (!name) return;

        try {
            await accountApi.createApiKey({ name });
            fetchApiKeys();
        } catch (err) {
            console.error('Failed to create API key:', err);
        }
    };

    const handleRevokeApiKey = async (id: string) => {
        if (!window.confirm('Are you sure you want to revoke this API key?')) return;

        try {
            await accountApi.revokeApiKey(id);
            fetchApiKeys();
        } catch (err) {
            console.error('Failed to revoke API key:', err);
        }
    };

    const handleAddWebhook = async () => {
        const url = prompt('Enter webhook URL:');
        if (!url) return;

        try {
            await accountApi.createWebhook({ url, events: ['payment.success', 'payment.failed'] });
            fetchWebhooks();
        } catch (err) {
            console.error('Failed to create webhook:', err);
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this webhook?')) return;

        try {
            await accountApi.deleteWebhook(id);
            fetchWebhooks();
        } catch (err) {
            console.error('Failed to delete webhook:', err);
        }
    };

    const tabs = [
        { id: 'general' as TabType, label: 'General', icon: Building2 },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
        { id: 'webhooks' as TabType, label: 'Webhooks', icon: Webhook },
        { id: 'ewa' as TabType, label: 'EWA', icon: Zap },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'general' && (
                    <form onSubmit={handleSaveAccount} className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={accountData.name}
                                    onChange={handleAccountChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={accountData.email}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    WhatsApp Phone
                                </label>
                                <input
                                    type="tel"
                                    name="whatsapp_phone"
                                    value={accountData.whatsapp_phone}
                                    onChange={handleAccountChange}
                                    placeholder="+254..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Country
                                </label>
                                <select
                                    name="country"
                                    value={accountData.country}
                                    onChange={handleAccountChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="KE">Kenya</option>
                                    <option value="UG">Uganda</option>
                                    <option value="TZ">Tanzania</option>
                                    <option value="RW">Rwanda</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {success && (
                                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Changes saved
                                </span>
                            )}
                            {error && (
                                <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'api-keys' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
                            <button
                                onClick={handleCreateApiKey}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                            >
                                Create New Key
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                            Last Used
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {apiKeys.map((key) => (
                                        <tr key={key.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {key.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleRevokeApiKey(key.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {apiKeys.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No API keys found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'webhooks' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h3>
                            <button
                                onClick={handleAddWebhook}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                            >
                                Add Webhook
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                            URL
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                            Status
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {webhooks.map((hook) => (
                                        <tr key={hook.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {hook.url}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteWebhook(hook.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {webhooks.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No webhooks found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'ewa' && (
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Enable EWA</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Allow employees to access a portion of their earned wages before corridor.
                                    </p>
                                </div>
                                <label htmlFor="ewa-toggle" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="ewa-toggle"
                                        className="sr-only peer"
                                        checked={ewaPolicyForm.is_enabled}
                                        onChange={handleToggleEwa}
                                        disabled={loadingEwa}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {ewaSettings?.is_enabled && (
                                <form onSubmit={handleSaveEwaPolicy} className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EWA Policy Rules</h3>

                                    <div>
                                        <label htmlFor="percentage_accessible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Percentage of Earned Wage Accessible (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="percentage_accessible"
                                            value={ewaPolicyForm.percentage_accessible * 100}
                                            onChange={(e) => handleEwaPolicyChange('percentage_accessible', parseFloat(e.target.value) / 100)}
                                            min="0"
                                            max="100"
                                            step="5"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={loadingEwa}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            The maximum percentage of earned wages an employee can access. (e.g., 50 for 50%)
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="max_withdrawal_per_period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Withdrawal per Period
                                        </label>
                                        <input
                                            type="number"
                                            id="max_withdrawal_per_period"
                                            value={ewaPolicyForm.max_withdrawal_per_period}
                                            onChange={(e) => handleEwaPolicyChange('max_withdrawal_per_period', parseFloat(e.target.value))}
                                            min="0"
                                            step="10"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={loadingEwa}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Maximum amount an employee can withdraw in a single pay period.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="transaction_fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Transaction Fee
                                        </label>
                                        <input
                                            type="number"
                                            id="transaction_fee"
                                            value={ewaPolicyForm.transaction_fee}
                                            onChange={(e) => handleEwaPolicyChange('transaction_fee', parseFloat(e.target.value))}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={loadingEwa}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Fixed fee charged per EWA transaction.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="cooldown_period_days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Cooldown Period (Days)
                                        </label>
                                        <input
                                            type="number"
                                            id="cooldown_period_days"
                                            value={ewaPolicyForm.cooldown_period_days}
                                            onChange={(e) => handleEwaPolicyChange('cooldown_period_days', parseInt(e.target.value))}
                                            min="0"
                                            step="1"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={loadingEwa}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Number of days an employee must wait between EWA requests.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="submit"
                                            disabled={loadingEwa}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            {loadingEwa ? 'Saving...' : 'Save EWA Policy'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {ewaSettings?.is_enabled && (
                            <div className="mt-10">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">EWA Requests</h3>
                                {loadingEwa ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                    </div>
                                ) : ewaRequests.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p>No EWA requests found.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                                        Employee
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                                        Amount
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                                                        Requested
                                                    </th>
                                                    <th scope="col" className="relative px-6 py-3">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {ewaRequests.map((request) => (
                                                    <tr key={request.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                            {request.employee_id} {/* Replace with employee name later */}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            ${request.amount_requested.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'disbursed' ? 'bg-green-100 text-green-800' : request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {request.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                            {new Date(request.requested_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            {request.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => { /* Handle Approve */ }}
                                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { /* Handle Reject */ }}
                                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <UpgradePrompt
                isOpen={upgradePrompt.isOpen}
                onClose={closeUpgradePrompt}
                feature={upgradePrompt.feature}
                message={upgradePrompt.message}
            />
        </div>
    );
};
