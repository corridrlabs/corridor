import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Save, X, ArrowLeft, Globe, Link as LinkIcon, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import clsx from 'clsx';
import { extractApiErrorMessage, toUserSafeError } from '../../utils/userError';

export const CreateGoal: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_amount: '',
        currency: 'USDC',
        product_link: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedTarget = parseFloat(formData.target_amount);
        if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
            setError('Enter a target amount greater than 0.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                target_amount: parsedTarget,
            };

            await api.post('/social/goals', payload);
            navigate('/goals');
        } catch (err: any) {
            setError(
                toUserSafeError(
                    extractApiErrorMessage(err),
                    'Could not create your goal right now. Please try again.'
                )
            );
            console.error('Error creating goal:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate('/goals')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition-colors group"
            >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                Back to Goals
            </button>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-100 border border-blue-100">
                        <Target size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Social Goal</h1>
                        <p className="text-slate-500 font-medium">Define your target and share it with the world.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                        <AlertCircle size={20} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Goal Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                placeholder="e.g., MacBook Pro M3 Max for the team"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                placeholder="Why are you raising funds? Give your supporters a clear reason to help."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Target Amount</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                                    <input
                                        type="number"
                                        name="target_amount"
                                        value={formData.target_amount}
                                        onChange={handleChange}
                                        min="1"
                                        step="0.01"
                                        className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Currency</label>
                                <div className="relative">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="USDC">USDC (Stablecoin)</option>
                                        <option value="KES">KES (Kenyan Shilling)</option>
                                        <option value="UGX">UGX (Ugandan Shilling)</option>
                                        <option value="NGN">NGN (Nigerian Naira)</option>
                                        <option value="SOL">SOL (Solana)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Product Link (Optional)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="url"
                                    name="product_link"
                                    value={formData.product_link}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                                    placeholder="https://amazon.com/product/..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/goals')}
                            className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Launch Goal
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
