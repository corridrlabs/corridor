import React, { useState, useEffect } from 'react';
import { Activity, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';

interface LiveMetric {
    label: string;
    value: number | string;
    change: number;
    icon: any;
    color: string;
}

interface RecentActivity {
    id: string;
    type: 'transaction' | 'user' | 'error';
    message: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
}

interface SystemHealth {
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
}

interface SystemError {
    time: string;
    error: string;
    severity: 'low' | 'medium' | 'high';
}

const RealtimeMonitoring: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
    const [health, setHealth] = useState<SystemHealth[]>([]);
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchRealtimeData = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.getRealtimeMetrics();
            const activityData = await analyticsService.getRealtimeActivity();

            // Combine the data
            setLiveMetrics(data.metrics || []);
            setActivities(activityData.activities || []);
            setHealth(data.health || []);
            setErrors(data.errors || []);
        } catch (error) {
            console.error('Failed to fetch realtime data', error);
            showToast('error', 'Failed to load realtime monitoring data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealtimeData();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Auto-refresh every 30 seconds
        const refreshInterval = setInterval(() => {
            fetchRealtimeData();
        }, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(refreshInterval);
        };
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            default:
                return null;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'transaction':
                return 'bg-blue-50 border-blue-200';
            case 'user':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Real-time Monitoring</h1>
                        <p className="text-gray-600">Live system metrics and activity feed</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchRealtimeData}
                            disabled={loading}
                            className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">
                                {currentTime.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {loading ? (
                        <>
                            <Skeleton variant="rectangular" height={120} />
                            <Skeleton variant="rectangular" height={120} />
                            <Skeleton variant="rectangular" height={120} />
                            <Skeleton variant="rectangular" height={120} />
                        </>
                    ) : (
                        liveMetrics.map((metric, index) => {
                            const Icon = metric.icon;
                            const colorClasses = {
                                green: 'bg-green-50 text-green-600',
                                blue: 'bg-blue-50 text-blue-600',
                                purple: 'bg-purple-50 text-purple-600',
                                amber: 'bg-amber-50 text-amber-600'
                            };
                            return (
                                <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500">{metric.label}</span>
                                        <div className={`p-2 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                                    <div className={`text-xs font-semibold ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% from avg
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Activity Feed */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-500">Live</span>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loading ? (
                                <>
                                    <Skeleton variant="rectangular" height={60} />
                                    <Skeleton variant="rectangular" height={60} />
                                    <Skeleton variant="rectangular" height={60} />
                                </>
                            ) : activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className={`p-3 rounded-lg border-2 ${getActivityColor(activity.type)} transition-all`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{activity.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                                            </div>
                                            {getStatusIcon(activity.status)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                        <div className="space-y-4">
                            {loading ? (
                                <>
                                    <Skeleton variant="rectangular" height={40} />
                                    <Skeleton variant="rectangular" height={40} />
                                    <Skeleton variant="rectangular" height={40} />
                                </>
                            ) : health.length > 0 ? (
                                health.map((healthItem, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-700">{healthItem.name}</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {healthItem.value}{healthItem.unit}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${healthItem.status === 'good' ? 'bg-green-500' :
                                                    healthItem.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${healthItem.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">No health data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Errors */}
                <div className="mt-6 bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
                    <div className="space-y-2">
                        {loading ? (
                            <>
                                <Skeleton variant="rectangular" height={60} />
                                <Skeleton variant="rectangular" height={60} />
                            </>
                        ) : errors.length > 0 ? (
                            errors.map((error, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{error.error}</p>
                                            <p className="text-xs text-gray-500">{error.time}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${error.severity === 'high' ? 'bg-red-100 text-red-700' :
                                        error.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {error.severity}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                <p className="text-sm">No recent errors</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealtimeMonitoring;
