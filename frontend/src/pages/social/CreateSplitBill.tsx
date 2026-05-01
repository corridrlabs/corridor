import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplitSquareVertical, Save, ArrowLeft, Globe, AlertCircle, Plus, X, Mail } from 'lucide-react';
import api from '../../services/api';
import { extractApiErrorMessage, toUserSafeError } from '../../utils/userError';

export const CreateSplitBill: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        total_amount: '',
        currency: 'USDC',
        item_link: '',
    });
    const [participants, setParticipants] = useState<string[]>(['']);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParticipantChange = (index: number, value: string) => {
        const newParticipants = [...participants];
        newParticipants[index] = value;
        setParticipants(newParticipants);
    };

    const addParticipant = () => {
        setParticipants([...participants, '']);
    };

    const removeParticipant = (index: number) => {
        if (participants.length > 1) {
            setParticipants(participants.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(formData.total_amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Enter a total amount greater than 0.');
            return;
        }

        const validParticipants = participants.map(p => p.trim()).filter(p => p !== '');
        if (validParticipants.length === 0) {
            setError('At least one participant email is required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                total_amount: parsedAmount,
                participants: validParticipants,
            };

            await api.post('/split', payload);
            navigate('/groups');
        } catch (err: any) {
            setError(
                toUserSafeError(
                    extractApiErrorMessage(err),
                    'Could not create your split request right now. Please try again.'
                )
            );
            console.error('Error creating split bill:', err);
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
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-100 border border-blue-100">
                        <SplitSquareVertical size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Split a Bill</h1>
                        <p className="text-slate-500 font-medium">Divide costs fairly among friends or colleagues.</p>
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
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium dark:text-white"
                                placeholder="e.g., Dinner at Zen Garden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium dark:text-white"
                                placeholder="What was this expense for?"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Total Bill Amount</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                                    <input
                                        type="number"
                                        name="total_amount"
                                        value={formData.total_amount}
                                        onChange={handleChange}
                                        min="1"
                                        step="0.01"
                                        className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium dark:text-white"
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
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold appearance-none cursor-pointer dark:text-white"
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

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 ml-1">Participants (Emails)</label>
                            {participants.map((participant, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={participant}
                                            onChange={(e) => handleParticipantChange(index, e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium dark:text-white"
                                            placeholder="friend@example.com"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeParticipant(index)}
                                        className="p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                                        disabled={participants.length === 1}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addParticipant}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-gray-700 transition-all"
                            >
                                <Plus size={18} />
                                Add Participant
                            </button>
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
                            className="flex-[2] px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Initiate Split
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
