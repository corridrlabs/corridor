import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { monitoringApi } from '../api/monitoring';
import { DashboardSkeleton } from './ui/Skeleton';
import { EnhancedKPICard, ModernCard, GlassButton } from './ui/EnhancedComponents';
import { TrendingUp, TrendingDown, Zap, Activity, AlertCircle, ArrowUpRight } from 'lucide-react';
import { designTokens } from '../styles/designSystem';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface DashboardProps {
    organizationId: string;
}

interface Metrics {
    total_executions: number;
    success_rate: number;
    average_duration: number;
    active_workflows: number;
    failed_executions_24h: number;
}

export const RealTimeDashboard: React.FC<DashboardProps> = ({ organizationId }) => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [executionTrend, setExecutionTrend] = useState<any>(null);
    const [statusBreakdown, setStatusBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load
        fetchDashboardData();

        // Real-time updates every 5 seconds
        const interval = setInterval(fetchDashboardData, 5000);

        return () => clearInterval(interval);
    }, [organizationId]);

    const fetchDashboardData = async () => {
        try {
            const [metricsData, trendData, breakdownData] = await Promise.all([
                monitoringApi.getKpis(organizationId),
                monitoringApi.getWorkflowTimeline(organizationId),
                monitoringApi.getWorkflowMetrics(organizationId),
            ]);



            setMetrics(metricsData);
            setExecutionTrend({
                labels: trendData.timeline.map((t: any) => t.date),
                datasets: [
                    {
                        label: 'Successful',
                        data: trendData.timeline.map((t: any) => t.successful),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    },
                    {
                        label: 'Failed',
                        data: trendData.timeline.map((t: any) => t.failed),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    },
                ],
            });

            setStatusBreakdown({
                labels: Object.keys(breakdownData.status_breakdown),
                datasets: [
                    {
                        data: Object.values(breakdownData.status_breakdown),
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                        ],
                    },
                ],
            });

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    if (loading) {
        return <DashboardSkeleton kpiCount={4} hasChart={true} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center lg:text-left">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                        Real-Time Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Monitor your workflows and performance metrics</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <EnhancedKPICard
                        title="Total Executions"
                        value={metrics?.total_executions || 0}
                        change="+12%"
                        changeType="increase"
                        icon={Activity}
                        iconColor="text-primary-600"
                        variant="glass"
                    />
                    <EnhancedKPICard
                        title="Success Rate"
                        value={`${metrics?.success_rate || 0}%`}
                        change="+2.5%"
                        changeType="increase"
                        icon={TrendingUp}
                        iconColor="text-success-600"
                        variant="gradient"
                    />
                    <EnhancedKPICard
                        title="Avg Duration"
                        value={`${metrics?.average_duration || 0}s`}
                        change="-1.2s"
                        changeType="increase"
                        icon={Zap}
                        iconColor="text-warning-600"
                        variant="glass"
                    />
                    <EnhancedKPICard
                        title="Active Workflows"
                        value={metrics?.active_workflows || 0}
                        change="+3"
                        changeType="increase"
                        icon={Activity}
                        iconColor="text-secondary-600"
                        variant="default"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Execution Trend */}
                    <ModernCard variant="glass" padding="lg" className="group">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Execution Trend</h2>
                            <GlassButton variant="secondary" size="sm" icon={ArrowUpRight}>
                                Export
                            </GlassButton>
                        </div>
                        {executionTrend && <Line data={executionTrend} options={{ responsive: true }} />}
                    </ModernCard>

                    {/* Status Breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
                        {statusBreakdown && <Doughnut data={statusBreakdown} options={{ responsive: true }} />}
                    </div>
                </div>

                {/* Recent Executions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
                    <RecentExecutionsTable organizationId={organizationId} />
                </div>

                {/* Alerts */}
                <div className="mt-6">
                    <AlertsPanel organizationId={organizationId} />
                </div>
            </div>
        </div>
    );
};

interface KPICardProps {
    title: string;
    value: string | number;
    trend: string;
    trendUp: boolean;
    icon: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendUp, icon }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
    );
};

const RecentExecutionsTable: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const [executions, setExecutions] = useState<any[]>([]);

    useEffect(() => {
        const fetchExecutions = async () => {
            const data = await monitoringApi.getExecutions(organizationId);
            setExecutions(data.executions || []);
        };

        fetchExecutions();
        const interval = setInterval(fetchExecutions, 10000); // Update every 10s

        return () => clearInterval(interval);
    }, [organizationId]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Workflow
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Started
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {executions.map((execution) => (
                        <tr key={execution.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {execution.workflow_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={execution.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {execution.duration}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(execution.started_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        running: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
            {status}
        </span>
    );
};

const AlertsPanel: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            const data = await monitoringApi.getAlerts(organizationId);
            setAlerts(data.alerts || []);
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, [organizationId]);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
            <div className="space-y-4">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical'
                            ? 'border-red-500 bg-red-50'
                            : alert.severity === 'warning'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-blue-500 bg-blue-50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <span className="text-sm text-gray-500">{alert.timestamp}</span>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RealTimeDashboard;
