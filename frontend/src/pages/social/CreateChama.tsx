import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Save, ArrowLeft, Globe, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { extractApiErrorMessage, toUserSafeError } from '../../utils/userError';

export const CreateChama: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        total_payout_goal: '',
        currency: 'KES',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedGoal = parseFloat(formData.total_payout_goal);
        if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
            setError('Enter a total payout goal greater than 0.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                total_payout_goal: parsedGoal,
            };

            await api.post('/chamas', payload);
            navigate('/groups');
        } catch (err: any) {
            setError(
                toUserSafeError(
                    extractApiErrorMessage(err),
                    'Could not create your chama right now. Please try again.'
                )
            );
            console.error('Error creating chama:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate('/groups')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition-colors group"
            >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                Back to Groups
            </button>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-100 border border-purple-100">
                        <Award size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Chama</h1>
                        <p className="text-slate-500 font-medium">Join forces with friends for rotating group savings.</p>
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
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Chama Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-medium dark:text-white"
                                placeholder="e.g., Weekend Travelers Savings"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-medium dark:text-white"
                                placeholder="Describe the purpose of this chama and membership rules."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Total Payout Goal</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                                    <input
                                        type="number"
                                        name="total_payout_goal"
                                        value={formData.total_payout_goal}
                                        onChange={handleChange}
                                        min="1"
                                        step="0.01"
                                        className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-medium dark:text-white"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Currency</label>
                                <div className="relative">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-bold appearance-none cursor-pointer dark:text-white"
                                    >
                                        <option value="KES">KES (Kenyan Shilling)</option>
                                        <option value="USDC">USDC (Stablecoin)</option>
                                        <option value="UGX">UGX (Ugandan Shilling)</option>
                                        <option value="NGN">NGN (Nigerian Naira)</option>
                                        <option value="SOL">SOL (Solana)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/groups')}
                            className="flex-1 px-6 py-4 border-2 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Create Chama
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
