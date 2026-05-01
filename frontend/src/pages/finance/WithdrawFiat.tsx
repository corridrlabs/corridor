import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowDownCircle,
    Building2,
    Smartphone,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface WithdrawFiatProps {
    onClose?: () => void;
}

const WithdrawFiat: React.FC<WithdrawFiatProps> = ({ onClose }) => {
    const { showToast } = useToast();
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('KES');
    const [destination, setDestination] = useState('');
    const [destinationType, setDestinationType] = useState<'MPESA' | 'BANK' | 'MOBILE'>('MPESA');
    const [loading, setLoading] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    useEffect(() => {
        fetchExchangeRate();
    }, [currency]);

    const fetchExchangeRate = async () => {
        try {
            const response = await api.get(`/social/exchange-rate?from=USDC&to=${currency}`);
            setExchangeRate(response.data.rate);
        } catch (err) {
            console.error('Failed to fetch exchange rate:', err);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !destination) {
            showToast('error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Use the existing payout endpoint with destination type
            await api.post('/payouts', {
                amount: parseFloat(amount),
                currency: 'USDC',
                destination_currency: currency,
                destination_bank: destinationType,
                destination_account: destination,
                description: `Withdrawal to ${destinationType}`
            });

            showToast('success', `Successfully initiated withdrawal of ${currency} ${(parseFloat(amount) * (exchangeRate || 1)).toFixed(2)}`);
            setAmount('');
            setDestination('');
            if (onClose) onClose();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Withdrawal failed. Please try again.';
            showToast('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const destinationPlaceholder = {
        MPESA: 'M-Pesa Number (e.g., 254712345678)',
        BANK: 'Bank Account Number',
        MOBILE: 'Mobile Money Number'
    }[destinationType];

    const estimatedAmount = exchangeRate ? (parseFloat(amount || '0') * exchangeRate).toFixed(2) : '0.00';

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <ArrowDownCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Withdraw to Local Currency</h2>
                            <p className="text-blue-100 text-sm">Fast, secure withdrawals to your local account</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleWithdraw} className="p-6 space-y-6">
                    {/* Destination Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Withdrawal Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setDestinationType('MPESA')}
                                className={`p-4 rounded-xl border-2 transition-all ${destinationType === 'MPESA'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Smartphone className="w-6 h-6 mx-auto mb-2 text-green-600" />
                                <div className="text-xs font-semibold">M-Pesa</div>
                                <div className="text-[10px] text-slate-500">Kenya</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDestinationType('BANK')}
                                className={`p-4 rounded-xl border-2 transition-all ${destinationType === 'BANK'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                <div className="text-xs font-semibold">Bank</div>
                                <div className="text-[10px] text-slate-500">Nigeria</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDestinationType('MOBILE')}
                                className={`p-4 rounded-xl border-2 transition-all ${destinationType === 'MOBILE'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Globe className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                                <div className="text-xs font-semibold">Mobile Money</div>
                                <div className="text-[10px] text-slate-500">Ghana</div>
                            </button>
                        </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="KES">🇰🇪 Kenyan Shilling (KES)</option>
                            <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                            <option value="GHS">🇬🇭 Ghanaian Cedi (GHS)</option>
                        </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Amount (USDC)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                            required
                        />
                        {exchangeRate && amount && (
                            <div className="text-sm text-slate-600">
                                ≈ <span className="font-bold text-blue-600">{currency} {estimatedAmount}</span>
                                <span className="text-xs text-slate-400 ml-2">(Rate: 1 USDC = {exchangeRate.toFixed(2)} {currency})</span>
                            </div>
                        )}
                    </div>

                    {/* Destination */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Destination Account</label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder={destinationPlaceholder}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Fee Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <div className="font-semibold mb-1">Transaction Fee: 0.5%</div>
                                <div className="text-blue-700 text-xs">
                                    Powered by Circle + Solana for fast, low-cost settlements
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                Withdraw {currency} {estimatedAmount}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WithdrawFiat;
