import React, { useEffect, useMemo, useState } from 'react';
import { Zap, Clock, Users, ArrowUpRight, TrendingUp, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface FeedItem {
    id: string;
    actor_name?: string;
    amount: number;
    currency: string;
    status: string;
    message?: string;
    created_at: string;
}

export const Feed: React.FC = () => {
    const [activities, setActivities] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await api.get('/social/feed');
                setActivities(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error('Failed to load social feed:', error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, []);

    const formatRelativeTime = (iso: string) => {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        if (Number.isNaN(diffMs) || diffMs < 0) return 'Just now';
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const normalized = useMemo(
        () =>
            activities.map((activity) => ({
                id: activity.id,
                user: activity.actor_name?.trim() || 'Corridor user',
                headline: activity.message?.trim() || 'completed a transaction',
                amount: `${activity.currency} ${Number(activity.amount || 0).toLocaleString()}`,
                time: formatRelativeTime(activity.created_at),
                status: activity.status || 'UNKNOWN',
            })),
        [activities]
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="px-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-yellow-600 dark:text-yellow-300 mb-4">
                    <Zap className="h-3.5 w-3.5" />
                    Live Activity
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Social Feed
                </h1>
                <p className="text-slate-500 font-medium mt-2">Real-time financial activity from your network.</p>
            </div>

            <div className="space-y-4 px-4">
                {loading && (
                    <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                        <p className="font-semibold uppercase tracking-widest text-xs">Loading feed...</p>
                    </div>
                )}

                {!loading && normalized.length === 0 && (
                    <div className="bg-white p-16 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Quiet for now</h3>
                        <p className="text-slate-500 text-sm mt-1">Start following people to see their public activity here.</p>
                    </div>
                )}

                {!loading && normalized.map(activity => (
                    <div key={activity.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:border-blue-200 hover:shadow-blue-200/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg group-hover:scale-105 transition-transform">
                                {activity.user[0]}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-x-2">
                                    <span className="font-bold text-blue-600 hover:underline">{activity.user}</span>
                                    <span className="text-slate-500 font-medium">{activity.headline}</span>
                                    <span className="text-slate-900 font-black tracking-tight">{activity.amount}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} className="text-slate-300" />
                                        {activity.time}
                                    </span>
                                    <span className={`flex items-center gap-1 ${activity.status === 'SUCCESS' || activity.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                            <ArrowUpRight size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
