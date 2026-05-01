import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Info } from 'lucide-react';

interface FeeBreakdown {
    amount: number;
    currency: string;
    fee: number;
    net_amount: number;
    is_instant: boolean;
    rate_applied: any;
}

const FeeCalculator: React.FC = () => {
    const [amount, setAmount] = useState<number>(1000);
    const [currency, setCurrency] = useState<string>('NGN');
    const [txType, setTxType] = useState<string>('local');
    const [isInstant, setIsInstant] = useState<boolean>(false);
    const [breakdown, setBreakdown] = useState<FeeBreakdown | null>(null);

    // Mock calculation logic (mirroring backend for immediate feedback)
    // In production, this could call the backend API
    const calculateFee = () => {
        let fee = 0;
        let rateInfo = "";

        if (currency === 'NGN') {
            if (txType === 'local') {
                fee = Math.min(amount * 0.015 + 0, 2000); // 1.5% capped at 2000
                rateInfo = "1.5% (Capped at N2000)";
            } else {
                fee = amount * 0.039;
                rateInfo = "3.9%";
            }
        } else if (currency === 'KES') {
            if (txType === 'local') {
                fee = amount * 0.029;
                rateInfo = "2.9%";
            } else {
                fee = amount * 0.038;
                rateInfo = "3.8%";
            }
        } else if (currency === 'USD') {
            fee = amount * 0.029 + 0.30;
            rateInfo = "2.9% + $0.30";
        } else if (currency === 'USDT') {
            if (txType === 'transfer') {
                fee = 1.0;
                rateInfo = "$1.00 Flat";
            } else {
                fee = 0;
                rateInfo = "Free";
            }
        }

        if (isInstant) {
            fee += amount * 0.005; // +0.5%
            rateInfo += " + 0.5% Instant Premium";
        }

        setBreakdown({
            amount,
            currency,
            fee: parseFloat(fee.toFixed(2)),
            net_amount: parseFloat((amount - fee).toFixed(2)),
            is_instant: isInstant,
            rate_applied: rateInfo
        });
    };

    useEffect(() => {
        calculateFee();
    }, [amount, currency, txType, isInstant]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Calculator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="absolute right-4 top-2 text-gray-500">{currency}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="NGN">NGN</option>
                                <option value="KES">KES</option>
                                <option value="USD">USD</option>
                                <option value="USDT">USDT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={txType}
                                onChange={(e) => setTxType(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="local">Local</option>
                                <option value="international">International</option>
                                <option value="transfer">Transfer</option>
                                <option value="payout">Payout</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="instant"
                            checked={isInstant}
                            onChange={(e) => setIsInstant(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="instant" className="text-sm text-gray-700 dark:text-gray-300">
                            Instant Settlement (+0.5%)
                        </label>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 flex flex-col justify-center">
                    {breakdown && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                <span>Transaction Fee</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {breakdown.fee.toLocaleString()} {currency}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Rate Applied</span>
                                <span>{breakdown.rate_applied}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">You Receive</span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {breakdown.net_amount.toLocaleString()} {currency}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeCalculator;
