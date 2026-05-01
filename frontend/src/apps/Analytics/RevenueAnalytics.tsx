import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, DollarSign, Users as UsersIcon } from 'lucide-react';

interface RevenueData {
    month: string;
    revenue: number;
    growth: number;
}

const RevenueAnalytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    const revenueData: RevenueData[] = [
        { month: 'Jan', revenue: 450000, growth: 12 },
        { month: 'Feb', revenue: 520000, growth: 15.5 },
        { month: 'Mar', revenue: 480000, growth: -7.7 },
        { month: 'Apr', revenue: 610000, growth: 27 },
        { month: 'May', revenue: 680000, growth: 11.5 },
        { month: 'Jun', revenue: 750000, growth: 10.3 }
    ];

    const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
    const avgGrowth = revenueData.reduce((sum, d) => sum + d.growth, 0) / revenueData.length;
    const mrr = revenueData[revenueData.length - 1].revenue;
    const arr = mrr * 12;

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
                    <p className="text-gray-600">Track your business revenue and growth</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2 mb-6">
                    {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                                }`}
                        >
                            {range === '7d' && 'Last 7 days'}
                            {range === '30d' && 'Last 30 days'}
                            {range === '90d' && 'Last 90 days'}
                            {range === '1y' && 'Last year'}
                        </button>
                    ))}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Total Revenue</span>
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {(totalRevenue / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-green-600 mt-1">↑ {avgGrowth.toFixed(1)}% avg growth</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">MRR</span>
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {(mrr / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">ARR</span>
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {(arr / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Annual Recurring Revenue</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Growth Rate</span>
                            <Activity className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{avgGrowth.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500 mt-1">Average monthly</div>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                    <div className="h-64 flex items-end gap-4">
                        {revenueData.map((data, index) => {
                            const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                            const height = (data.revenue / maxRevenue) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            KES {(data.revenue / 1000).toFixed(0)}K
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">{data.month}</div>
                                    <div className={`text-xs font-semibold ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {data.growth >= 0 ? '+' : ''}{data.growth}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'EWA Services', amount: 450000, percentage: 60 },
                                { name: 'Payment Processing', amount: 225000, percentage: 30 },
                                { name: 'Subscriptions', amount: 75000, percentage: 10 }
                            ].map((product, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-700">{product.name}</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            KES {(product.amount / 1000).toFixed(0)}K
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${product.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'ABC Corporation', revenue: 125000 },
                                { name: 'XYZ Ltd', revenue: 98000 },
                                { name: 'Tech Startup Inc', revenue: 87000 },
                                { name: 'Global Enterprises', revenue: 76000 },
                                { name: 'Innovation Co', revenue: 64000 }
                            ].map((customer, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                                            <UsersIcon className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <span className="text-sm text-gray-700">{customer.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        KES {(customer.revenue / 1000).toFixed(0)}K
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueAnalytics;
