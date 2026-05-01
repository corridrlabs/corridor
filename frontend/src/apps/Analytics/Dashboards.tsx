import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, BarChart3, TrendingUp, Users, DollarSign, Activity, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';

interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: number;
    lastUpdated: string;
    isDefault: boolean;
}

const Dashboards: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchDashboards = async () => {
        setLoading(true);
        try {
            const data = await analyticsService.getDashboards();
            setDashboards(data);
        } catch (error) {
            console.error('Failed to fetch dashboards', error);
            showToast('error', 'Failed to load dashboards');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboards();
    }, []);

    const quickStats = [
        { label: 'Total Dashboards', value: dashboards.length, icon: LayoutDashboard, color: 'indigo' },
        { label: 'Total Widgets', value: dashboards.reduce((sum, d) => sum + d.widgets, 0), icon: BarChart3, color: 'purple' },
        { label: 'Active Users', value: 24, icon: Users, color: 'green' },
        { label: 'Data Points', value: '1.2M', icon: Activity, color: 'amber' }
    ];

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboards</h1>
                        <p className="text-gray-600">Create and manage your analytics dashboards</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDashboards}
                            disabled={loading}
                            className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Dashboard
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {loading ? (
                        <>
                            <Skeleton variant="rectangular" height={100} />
                            <Skeleton variant="rectangular" height={100} />
                            <Skeleton variant="rectangular" height={100} />
                            <Skeleton variant="rectangular" height={100} />
                        </>
                    ) : (
                        quickStats.map((stat, index) => {
                            const Icon = stat.icon;
                            const colorClasses = {
                                indigo: 'bg-indigo-50 text-indigo-600',
                                purple: 'bg-purple-50 text-purple-600',
                                green: 'bg-green-50 text-green-600',
                                amber: 'bg-amber-50 text-amber-600'
                            };
                            return (
                                <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500">{stat.label}</span>
                                        <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Dashboards Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {loading ? (
                        <>
                            <Skeleton variant="rectangular" height={280} />
                            <Skeleton variant="rectangular" height={280} />
                        </>
                    ) : (
                        <>
                            {dashboards.map((dashboard) => (
                                <div
                                    key={dashboard.id}
                                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-md transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center">
                                                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">{dashboard.name}</h3>
                                                    {dashboard.isDefault && (
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">{dashboard.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                        <span>{dashboard.widgets} widgets</span>
                                        <span>Updated {dashboard.lastUpdated}</span>
                                    </div>

                                    {/* Preview Placeholder */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-32 mb-4 flex items-center justify-center border-2 border-gray-200">
                                        <div className="text-center">
                                            <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <span className="text-xs text-gray-500">Dashboard Preview</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm">
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Create New Dashboard Card */}
                            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 hover:border-indigo-300 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[280px]">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                    <Plus className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Create New Dashboard</h3>
                                <p className="text-sm text-gray-500 text-center">
                                    Build custom dashboards with drag-and-drop widgets
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Templates Section */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Templates</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'Sales Dashboard', icon: DollarSign, widgets: 6 },
                            { name: 'Marketing Dashboard', icon: TrendingUp, widgets: 5 },
                            { name: 'Operations Dashboard', icon: Activity, widgets: 7 }
                        ].map((template, index) => {
                            const Icon = template.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <Icon className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                                            <p className="text-xs text-gray-500">{template.widgets} pre-built widgets</p>
                                        </div>
                                    </div>
                                    <button className="w-full mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                                        Use Template
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboards;

// export default Dashboards;
