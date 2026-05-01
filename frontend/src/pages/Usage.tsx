import { useState, useEffect } from 'react';
import { Building2, Users, FolderOpen, Activity, TrendingUp } from 'lucide-react';
import { accountApi } from '../api/account';
import { GenericPageSkeleton } from '../components/ui/Skeletons';

interface UsageMetrics {
    api_requests_count: number;
    api_requests_limit: number;
    team_members_count: number;
    team_members_limit: number;
    projects_count: number;
    projects_limit: number;
    storage_used_mb: number;
    storage_limit_mb: number;
}

export const Usage = () => {
    const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usageData, activityData] = await Promise.all([
                accountApi.getUsage().catch((err: any) => {
                    console.error('Usage API error:', err);
                    return {
                        api_requests_count: 0,
                        api_requests_limit: 10000,
                        team_members_count: 0,
                        team_members_limit: 10,
                        projects_count: 0,
                        projects_limit: 50,
                        storage_used_mb: 0,
                        storage_limit_mb: 1000,
                    };
                }),
                accountApi.getActivity(10).catch((err: any) => {
                    console.error('Activity API error:', err);
                    return { activities: [] };
                })
            ]);
            setMetrics(usageData);
            setActivity(activityData.activities || []);
        } catch (err: any) {
            console.error('Failed to fetch usage metrics:', err);
            setError(err?.response?.data?.detail || err?.message || 'Failed to load usage data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPercentage = (used: number, limit: number) => {
        if (limit === 0) return 0;
        return Math.round((used / limit) * 100);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-600';
        if (percentage >= 70) return 'bg-yellow-600';
        return 'bg-green-600';
    };

    if (loading) {
        return <GenericPageSkeleton cardRows={4} />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-900">Error Loading Usage</h3>
                    <p className="text-gray-500 mt-2">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">No Data Available</h3>
                    <p className="text-gray-500 mt-2">Unable to retrieve usage metrics.</p>
                </div>
            </div>
        );
    }

    const usageItems = [
        {
            icon: Activity,
            label: 'API Requests',
            used: metrics.api_requests_count,
            limit: metrics.api_requests_limit,
            unit: 'requests'
        },
        {
            icon: Users,
            label: 'Team Members',
            used: metrics.team_members_count,
            limit: metrics.team_members_limit,
            unit: 'members'
        },
        {
            icon: FolderOpen,
            label: 'Projects',
            used: metrics.projects_count,
            limit: metrics.projects_limit,
            unit: 'projects'
        },
        {
            icon: TrendingUp,
            label: 'Storage',
            used: metrics.storage_used_mb,
            limit: metrics.storage_limit_mb,
            unit: 'MB'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Usage & Limits</h2>
                <p className="text-gray-500">Monitor your plan usage and limits for your account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {usageItems.map((item, index) => {
                    const percentage = getPercentage(item.used, item.limit);
                    const Icon = item.icon;

                    return (
                        <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Icon className="text-indigo-600" size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                                    <p className="text-sm text-gray-500">
                                        {item.used.toLocaleString()} / {item.limit.toLocaleString()} {item.unit}
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>

                            {percentage >= 80 && (
                                <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                    ⚠️ Approaching limit. Consider upgrading your plan.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    {activity.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No recent activity</div>
                    ) : (
                        activity.map((item, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'invoice' ? 'bg-blue-500' : 'bg-green-500'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{item.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                <div className="flex items-start gap-4">
                    <Building2 className="text-indigo-600 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Need more resources?</h3>
                        <p className="text-gray-600 mb-4">
                            Upgrade to a higher plan to get increased limits, advanced features, and priority support.
                        </p>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            View Plans
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
