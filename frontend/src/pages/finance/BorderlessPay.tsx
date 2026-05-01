import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Globe,
    ArrowRight,
    RefreshCcw,
    ShieldCheck,
    Zap,
    ArrowUpRight,
    Search,
    ChevronDown,
    Info,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import clsx from 'clsx';
import { useToast } from '../../contexts/ToastContext';

const currencies = [
    { code: 'USDC', name: 'USDC (Stable)', flag: '🇺🇸' },
    { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
    { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'SOL', name: 'Solana', flag: '🪐' }
];

export const BorderlessPay: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [fromCurrency, setFromCurrency] = useState('USDC');
    const [toCurrency, setToCurrency] = useState('KES');
    const [amount, setAmount] = useState('100');
    const [recipient, setRecipient] = useState(''); // Email or @handle
    const [rate, setRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [converting, setConverting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [actionableError, setActionableError] = useState<string | null>(null);

    useEffect(() => {
        fetchRate();
    }, [fromCurrency, toCurrency]);

    const fetchRate = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/social/exchange-rate?from=${fromCurrency}&to=${toCurrency}`);
            setRate(response.data.rate);
        } catch (err) {
            console.error('Failed to fetch rate:', err);
            setRate(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionableError(null);

        if (!recipient.trim()) {
            showToast('error', 'Please enter a recipient email or @handle');
            return;
        }

        setConverting(true);
        try {
            // Determine if recipient is email or handle
            const payload: any = {
                amount: parseFloat(amount),
                currency: fromCurrency,
                message: 'Borderless Transfer'
            };

            if (recipient.startsWith('@')) {
                payload.to_handle = recipient;
            } else {
                payload.to_email = recipient;
            }

            await api.post('/social/pay', payload);

            setSuccess(true);
            showToast('success', `Successfully sent ${fromCurrency} ${amount} to ${recipient}`);
            setTimeout(() => {
                setSuccess(false);
                setRecipient('');
                setAmount('100');
            }, 3000);
        } catch (err: any) {
            console.error('Transfer failed:', err);
            const rawError =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                '';
            const errorMsg = typeof rawError === 'string' ? rawError : 'Transfer failed';

            if (/sender wallet not found for currency/i.test(errorMsg)) {
                const guide = `No ${fromCurrency} sender wallet was found. Open Add Funds to create/fund your ${fromCurrency} wallet, then retry. You can also switch "You Send" to a currency you already hold.`;
                setActionableError(guide);
                showToast('error', guide);
            } else {
                showToast('error', errorMsg || 'Transfer failed. Please ensure you have funds and a valid recipient.');
            }
        } finally {
            setConverting(false);
        }
    };

    const result = rate ? (parseFloat(amount || '0') * rate).toFixed(2) : '0.00';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center space-y-4 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">
                    <Globe size={14} />
                    Borderless Money Transfer
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    Send money anywhere <br /> <span className="text-blue-600">to any currency.</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                    Instantly convert and send funds across borders with zero hidden fees and instant transfers powered by Solana.
                </p>
            </div>

            {/* Main Converter Card */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-200/50">
                <form onSubmit={handleSend} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-6">
                        {/* From */}
                        <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">You Send</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-6 pr-32 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-3xl font-black text-slate-900 shadow-inner group-hover:bg-white"
                                    placeholder="0.00"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none hover:bg-slate-50 transition-colors cursor-pointer appearance-none pr-8"
                                    >
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <button
                            type="button"
                            onClick={handleSwap}
                            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl group"
                        >
                            <RefreshCcw className="group-hover:rotate-180 transition-transform duration-500" size={24} />
                        </button>

                        {/* To */}
                        <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">They Receive</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={result}
                                    readOnly
                                    className="w-full pl-6 pr-32 py-8 bg-slate-50 border-2 border-slate-50 rounded-[2rem] text-3xl font-black text-blue-600 shadow-inner cursor-default opacity-80"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none hover:bg-slate-50 transition-colors cursor-pointer appearance-none pr-8"
                                    >
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rate Info */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <RefreshCcw size={18} className={clsx("text-blue-600", loading && "animate-spin")} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Guaranteed Rate</p>
                                <p className="font-bold text-slate-900">
                                    {loading ? 'Fetching...' : `1 ${fromCurrency} = ${rate} ${toCurrency}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Transfer Fee</p>
                                <p className="font-bold text-emerald-600">$0.00 <span className="text-[10px] bg-emerald-100 px-1 rounded uppercase ml-1">Free</span></p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 hidden md:block" />
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Time</p>
                                <p className="font-bold text-slate-900 flex items-center gap-1">
                                    <Zap size={14} className="text-yellow-500" />
                                    Instant
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Success / Form Actions */}
                    {success ? (
                        <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] text-center space-y-4 animate-bounce-short">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Transfer Complete!</h3>
                            <p className="text-slate-600 font-medium">Funds have been sent and are available instantly.</p>
                            <button onClick={() => setSuccess(false)} className="text-emerald-600 font-bold hover:underline">Send another transfer</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Recipient's Email or @handle"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold placeholder:text-slate-300"
                                    required
                                />
                                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            </div>

                            {actionableError && (
                                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900">
                                    <p className="text-sm font-medium leading-relaxed">{actionableError}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/add-funds')}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                                        >
                                            Go to Add Funds
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFromCurrency('USDC')}
                                            className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 text-xs font-semibold"
                                        >
                                            Switch to USDC
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={converting || !amount || parseFloat(amount) <= 0}
                                className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] group"
                            >
                                {converting ? (
                                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <ArrowUpRight size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Send Funds Instantly
                                    </>
                                )}
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-blue-400" />
                                    Secured by Solana
                                </div>
                                <div className="flex items-center gap-2">
                                    <Info size={14} className="text-slate-300" />
                                    No Hidden Fee Policy
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Trust Badges / Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {[
                    { title: 'Zero Conversion Fee', desc: 'We offer real mid-market rates with no sneaky markups.', icon: <Zap className="text-yellow-500" /> },
                    { title: 'Verified Transfer', desc: 'Every transaction is securely recorded and verifiable.', icon: <CheckCircle className="text-emerald-500" /> },
                    { title: 'Instant Transfers', desc: 'Funds reach the recipient in seconds, not days.', icon: <Globe className="text-blue-500" /> }
                ].map((item, i) => (
                    <div key={i} className="p-8 bg-white/50 border border-slate-100 rounded-3xl backdrop-blur-md">
                        <div className="p-3 bg-white rounded-2xl shadow-sm w-fit mb-6">
                            {item.icon}
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
