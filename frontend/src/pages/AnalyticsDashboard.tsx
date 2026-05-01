import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { Activity, CheckCircle, XCircle, Zap, ArrowRight, DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['analytics-dashboard'],
        queryFn: () => api.get('/analytics/dashboard').then((res: any) => res.data)
    });

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const workflowStats = metrics?.workflow_stats || {};
    const recentActivity = metrics?.recent_activity || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">System Health & Activity</h1>
                <p className="text-gray-500 mt-2">Monitor your workflows, payments, and system performance.</p>
            </div>

            {/* Workflow Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                        <Zap className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workflowStats.total_active || 0}</div>
                        <p className="text-xs text-muted-foreground">Automations running</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workflowStats.success_rate || 0}%</div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workflowStats.failed_count || 0}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Payment Infrastructure Card */}
                <Card className="col-span-1 bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payment Infrastructure
                        </CardTitle>
                        <CardDescription className="text-indigo-200">
                            Direct access to Shadow Wallet & Rails
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                            <p className="text-sm text-indigo-200">Wallet Balance</p>
                            <h3 className="text-2xl font-bold mt-1">$12,450.00 <span className="text-sm font-normal text-indigo-300">USDC</span></h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" className="w-full bg-white text-indigo-900 hover:bg-indigo-50">
                                Send Money
                            </Button>
                            <Button variant="outline" className="w-full border-indigo-400 text-indigo-100 hover:bg-indigo-800 hover:text-white">
                                Add Funds
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-indigo-300 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Synced with Solana Mainnet
                        </p>
                    </CardFooter>
                </Card>

                {/* Unified Activity Log */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-500" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Unified log of payments, workflows, and system events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No recent activity.</p>
                            ) : (
                                recentActivity.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${item.type === 'transaction' ? 'bg-green-100 text-green-600' :
                                                item.type === 'workflow' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {item.type === 'transaction' ? <DollarSign className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.amount && (
                                                <p className={`text-sm font-bold ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {item.amount > 0 ? '+' : ''}${Math.abs(item.amount)}
                                                </p>
                                            )}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${item.status === 'success' || item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900">
                            View All Activity <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
