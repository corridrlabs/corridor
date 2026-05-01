import React, { useState, useEffect } from 'react';
import { Repeat, Plus, Pause, Play, X, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react';
import { subscriptionsService, Subscription } from '../../services/subscriptions';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton, TableSkeleton } from '../../components/common/Skeleton';

const Subscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const data = await subscriptionsService.getAll();
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            showToast('error', 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
        if (action === 'cancel' && !window.confirm('Are you sure you want to cancel this subscription?')) return;

        setActionLoading(id);
        try {
            if (action === 'pause') await subscriptionsService.pause(id);
            else if (action === 'resume') await subscriptionsService.resume(id);
            else if (action === 'cancel') await subscriptionsService.cancel(id);

            showToast('success', `Subscription ${action}d successfully`);
            fetchSubscriptions();
        } catch (error) {
            showToast('error', `Failed to ${action} subscription`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            paused: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const totalMRR = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.amount, 0);

    const activeCount = subscriptions.filter(s => s.status === 'active').length;

    if (loading && !subscriptions.length) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton variant="text" width={200} height={32} />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton variant="rectangular" height={120} />
                        <Skeleton variant="rectangular" height={120} />
                        <Skeleton variant="rectangular" height={120} />
                    </div>
                    <TableSkeleton rows={5} cols={7} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
                        <p className="text-gray-600">Manage recurring billing and subscriptions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchSubscriptions}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Subscription
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Monthly Recurring Revenue</span>
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">KES {totalMRR.toLocaleString()}</div>
                        <div className="text-xs text-green-600 mt-1">↑ 12% from last month</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Active Subscriptions</span>
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
                        <div className="text-xs text-gray-500 mt-1">Out of {subscriptions.length} total</div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Churn Rate</span>
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">2.3%</div>
                        <div className="text-xs text-green-600 mt-1">↓ 0.5% improvement</div>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{sub.customer}</div>
                                            <div className="text-xs text-gray-500">Since {new Date(sub.start_date).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{sub.plan_name}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        KES {sub.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.interval}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(sub.next_billing).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {sub.status === 'active' ? (
                                                <button
                                                    onClick={() => handleAction(sub.id, 'pause')}
                                                    disabled={actionLoading === sub.id}
                                                    className="p-2 hover:bg-yellow-50 rounded transition-colors disabled:opacity-50"
                                                    title="Pause"
                                                >
                                                    {actionLoading === sub.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin text-yellow-600" />
                                                    ) : (
                                                        <Pause className="w-4 h-4 text-yellow-600" />
                                                    )}
                                                </button>
                                            ) : sub.status === 'paused' ? (
                                                <button
                                                    onClick={() => handleAction(sub.id, 'resume')}
                                                    disabled={actionLoading === sub.id}
                                                    className="p-2 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                                    title="Resume"
                                                >
                                                    {actionLoading === sub.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-green-600" />
                                                    )}
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => handleAction(sub.id, 'cancel')}
                                                disabled={actionLoading === sub.id}
                                                className="p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                title="Cancel"
                                            >
                                                {actionLoading === sub.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-600" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No active subscriptions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Subscription Plans */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { name: 'Basic', price: 5000, features: ['Up to 10 employees', 'Basic analytics', 'Email support'] },
                            { name: 'Pro', price: 15000, features: ['Up to 50 employees', 'Advanced analytics', 'Priority support', 'API access'] },
                            { name: 'Enterprise', price: 50000, features: ['Unlimited employees', 'Custom analytics', '24/7 support', 'Dedicated account manager'] }
                        ].map((plan, index) => (
                            <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-4">
                                    <Repeat className="w-6 h-6 text-indigo-600" />
                                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                </div>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-gray-900">KES {plan.price.toLocaleString()}</span>
                                    <span className="text-gray-500">/month</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                    Select Plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscriptions;
