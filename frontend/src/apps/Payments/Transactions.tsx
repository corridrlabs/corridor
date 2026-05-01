import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { transactionsService, Transaction, TransactionStats } from '../../services/transactions';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton, TableSkeleton } from '../../components/common/Skeleton';

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<TransactionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txnsData, statsData] = await Promise.all([
                transactionsService.getAll(),
                transactionsService.getStats()
            ]);
            setTransactions(txnsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            showToast('error', 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = async () => {
        try {
            await transactionsService.export('csv');
            showToast('success', 'Export started');
        } catch (error) {
            showToast('error', 'Failed to export transactions');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            failed: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading && !transactions.length) {
        return (
            <div className="h-full bg-[#F5F1E8] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton variant="text" width={200} height={32} />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={100} />
                    </div>
                    <TableSkeleton rows={10} cols={7} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F5F1E8] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>
                        <p className="text-gray-600">View and manage all your transactions</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Total In</span>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {stats?.total_credit.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Total Out</span>
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {stats?.total_debit.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">Net</span>
                            <DollarSign className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            KES {stats?.net.toLocaleString() || '0'}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transactions
                                .filter(t => t.description.toLowerCase().includes(filter.toLowerCase()) || t.id.toLowerCase().includes(filter.toLowerCase()))
                                .map((txn) => (
                                    <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{txn.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(txn.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{txn.description}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{txn.method}</td>
                                        <td className={`px-6 py-4 text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {txn.type === 'credit' ? '+' : '-'} KES {txn.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(txn.status)}</td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                                <Eye className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
