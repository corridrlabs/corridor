import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Search, AlertCircle, ChevronRight, Share2 } from 'lucide-react';
import api from '../../services/api';
import { GenericPageSkeleton } from '../../components/ui/Skeletons';
import { formatCurrency } from '../../utils/formatting';
import { APP_BASE_URL } from '../../config/env';
import { useToast } from '../../contexts/ToastContext';

export const Goals: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/social/goals');
            setGoals(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch social goals.');
            console.error('Error fetching social goals:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredGoals = (Array.isArray(goals) ? goals : []).filter(goal =>
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleShareGoal = async (e: React.MouseEvent, goal: any) => {
        e.stopPropagation();
        const shareUrl = goal.share_link || `${APP_BASE_URL}/goals/${goal.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('success', 'Goal link copied to clipboard.');
        } catch {
            showToast('error', 'Could not copy link. Try copying from the goal detail page.');
        }
    };

    if (loading) {
        return <GenericPageSkeleton showSearch cardRows={6} />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Social Goals</h1>
                    <p className="text-slate-500 font-medium">Create goals, share links, and raise funds together.</p>
                </div>
                <button
                    onClick={() => navigate('/goals/new')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    <Plus size={20} /> New Goal
                </button>
            </div>

            <div className="relative px-4">
                <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
                />
            </div>

            {error && (
                <div className="mx-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {filteredGoals.length === 0 ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 mx-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Target size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Goals Found</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
                        {searchQuery ? "Your search didn't match any goals." : "Ready to start something big? Create your first social goal today."}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => navigate('/goals/new')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Create Goal
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {filteredGoals.map(goal => (
                        <div
                            key={goal.id}
                            className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
                            onClick={() => navigate(`/goals/${goal.id}`)}
                        >
                            <div className="relative h-48 bg-slate-100 overflow-hidden">
                                {goal.product_link ? (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700 opacity-80"></div>
                                )}
                                <div className="absolute bottom-4 left-4 z-20">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                                        {goal.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{goal.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{goal.description}</p>

                                <div className="space-y-4">
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Raised</p>
                                            <p className="text-lg font-black text-slate-900">
                                                {formatCurrency(goal.current_amount, goal.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Goal</p>
                                            <p className="text-sm font-bold text-slate-600">
                                                {formatCurrency(goal.target_amount, goal.currency)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <button
                                        onClick={(e) => handleShareGoal(e, goal)}
                                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        <Share2 size={14} />
                                        Share Link
                                    </button>
                                    <ChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
