import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Clock, CheckCircle, AlertCircle, ArrowUpRight, Loader } from 'lucide-react';
import { payoutsApi } from '../api/payouts';
import FeeCalculator from '../components/FeeCalculator';
import api from '../services/api';

const Payouts: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('NGN');
    const [destinationBank, setDestinationBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();

    // Fetch Wallets for Balance Display
    const { data: wallets = [] } = useQuery({
        queryKey: ['wallets'],
        queryFn: async () => {
            const res = await api.get('/wallets');
            return res.data;
        }
    });

    const ngnWallet = Array.isArray(wallets) ? wallets.find((w: any) => w.currency === 'NGN') : null;
    const usdWallet = Array.isArray(wallets) ? wallets.find((w: any) => w.currency === 'USD') : null;

    // Fetch Payout History
    const { data: payouts = [], isLoading: historyLoading } = useQuery({
        queryKey: ['payouts'],
        queryFn: payoutsApi.getPayouts
    });

    const requestPayoutMutation = useMutation({
        mutationFn: payoutsApi.requestPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            setSuccessMsg('Payout requested successfully!');
            setAmount('');
            setAccountNumber('');
            setAccountName('');
            setTimeout(() => setSuccessMsg(''), 5000);
        },
        onError: (err: any) => {
            const rawError = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data || err?.message || '';
            const parsedError = typeof rawError === 'string' ? rawError : 'Failed to request payout.';
            if (/sender wallet not found for currency/i.test(parsedError)) {
                setErrorMsg(`No ${currency} wallet was found for your account. Add funds/create a ${currency} wallet first, or switch to a currency you already hold, then retry.`);
            } else {
                setErrorMsg(parsedError || 'Failed to request payout.');
            }
            setTimeout(() => setErrorMsg(''), 5000);
        }
    });

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();
        requestPayoutMutation.mutate({
            amount: parseFloat(amount),
            currency,
            destination_bank: destinationBank,
            account_number: accountNumber,
            account_name: accountName
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts & Settlements</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your funds and request withdrawals.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('request')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'request' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Request Payout
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Available</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        ₦ {ngnWallet?.balance?.toLocaleString() || '0.00'}
                    </h3>
                    <p className="text-sm text-gray-500">NGN Balance</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Available</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        $ {usdWallet?.balance?.toLocaleString() || '0.00'}
                    </h3>
                    <p className="text-sm text-gray-500">USD Balance (Circle)</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Pending</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₦ 0.00</h3>
                    <p className="text-sm text-gray-500">Settling (T+1)</p>
                </div>
            </div>

            {activeTab === 'request' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Payout</h3>

                            {successMsg && (
                                <div className="p-3 bg-green-100 text-green-700 rounded-lg mb-4 flex items-center gap-2">
                                    <CheckCircle size={18} /> {successMsg}
                                </div>
                            )}
                            {errorMsg && (
                                <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} /> {errorMsg}
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleRequest}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount to Withdraw</label>
                                        <input
                                            type="number"
                                            required
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        >
                                            <option value="NGN">NGN</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination Bank</label>
                                    <input
                                        type="text"
                                        required
                                        value={destinationBank}
                                        onChange={(e) => setDestinationBank(e.target.value)}
                                        placeholder="e.g. Access Bank"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            placeholder="1234567890"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={requestPayoutMutation.isLoading}
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {requestPayoutMutation.isLoading ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ArrowUpRight className="w-5 h-5" />
                                            Process Withdrawal
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <FeeCalculator />
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Reference</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Destination</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(Array.isArray(payouts) ? payouts : []).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No payout history found
                                    </td>
                                </tr>
                            ) : (
                                (Array.isArray(payouts) ? payouts : []).map((p: any) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">#{p.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {p.currency} {p.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {p.destination_bank} (**** {p.account_number_last4})
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${p.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                            `}>
                                                {p.status === 'PROCESSED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Payouts;
