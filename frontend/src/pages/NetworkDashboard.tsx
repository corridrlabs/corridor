import React, { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Search, RefreshCw, UserPlus, UserMinus, Users } from 'lucide-react';
import api from '../services/api';

type NetworkAccount = {
    id: string;
    full_name: string;
    username?: string;
    email?: string;
    account_type: string;
    country?: string;
    following?: boolean;
};

type NetworkResponse = {
    following: NetworkAccount[];
    suggestions: NetworkAccount[];
    following_count: number;
};

const NetworkDashboard = () => {
    const [query, setQuery] = useState('');
    const [following, setFollowing] = useState<NetworkAccount[]>([]);
    const [suggestions, setSuggestions] = useState<NetworkAccount[]>([]);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mutatingId, setMutatingId] = useState<string | null>(null);

    const loadNetwork = async (search = '') => {
        setLoading(true);
        try {
            const { data } = await api.get<NetworkResponse>('/social/network', {
                params: search ? { q: search } : undefined,
            });
            setFollowing(Array.isArray(data.following) ? data.following : []);
            setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
            setFollowingCount(Number(data.following_count || 0));
        } catch (error) {
            console.error('Failed to load network:', error);
            setFollowing([]);
            setSuggestions([]);
            setFollowingCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handle = window.setTimeout(() => {
            void loadNetwork(query.trim());
        }, 250);

        return () => window.clearTimeout(handle);
    }, [query]);

    const refreshNetwork = () => {
        void loadNetwork(query.trim());
    };

    const follow = async (accountId: string) => {
        setMutatingId(accountId);
        try {
            await api.post('/social/network/follow', { account_id: accountId });
            await loadNetwork(query.trim());
        } catch (error) {
            console.error('Failed to follow account:', error);
        } finally {
            setMutatingId(null);
        }
    };

    const unfollow = async (accountId: string) => {
        setMutatingId(accountId);
        try {
            await api.delete('/social/network/unfollow', { data: { account_id: accountId } });
            await loadNetwork(query.trim());
        } catch (error) {
            console.error('Failed to unfollow account:', error);
        } finally {
            setMutatingId(null);
        }
    };

    useEffect(() => {
        void loadNetwork();
    }, []);

    const visibleSuggestions = useMemo(
        () => suggestions.filter((account) => !following.some((item) => item.id === account.id)),
        [suggestions, following]
    );

    const formatHandle = (account: NetworkAccount) => {
        if (account.username?.trim()) return `@${account.username.trim()}`;
        if (account.email?.trim()) return account.email.trim();
        return 'Corridor user';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                        <Globe size={12} />
                        Network
                    </div>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Your social network</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Follow people and organizations to shape the activity that appears in your feed.
                    </p>
                </div>

                <button
                    onClick={refreshNetwork}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:border-blue-300 transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                        <Users size={16} />
                        Following
                    </div>
                    <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{followingCount}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                        <Search size={16} />
                        Search
                    </div>
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Find accounts by name, handle, or email.</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                        <Check size={16} />
                        Feed scope
                    </div>
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Feed activity now follows your social graph, not shared demo rows.</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Discover accounts</label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search people or companies"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Following</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">These accounts can influence what shows up in your feed.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {!loading && following.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500 dark:text-slate-400">
                                You are not following anyone yet.
                            </div>
                        )}

                        {following.map((account) => (
                            <div key={account.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{account.full_name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{formatHandle(account)}</div>
                                </div>
                                <button
                                    onClick={() => unfollow(account.id)}
                                    disabled={mutatingId === account.id}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
                                >
                                    <UserMinus size={16} />
                                    Unfollow
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Suggestions</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Follow accounts to personalize the feed.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {!loading && visibleSuggestions.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500 dark:text-slate-400">
                                No additional accounts found.
                            </div>
                        )}

                        {visibleSuggestions.map((account) => (
                            <div key={account.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{account.full_name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{formatHandle(account)}</div>
                                </div>
                                <button
                                    onClick={() => follow(account.id)}
                                    disabled={mutatingId === account.id}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                    <UserPlus size={16} />
                                    {account.following ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {loading && (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-500 dark:text-slate-400">
                    Loading network...
                </div>
            )}
        </div>
    );
};

export default NetworkDashboard;
