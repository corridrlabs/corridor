import React, { useState, useEffect } from 'react';
import { APP_BASE_URL } from '../../config/env';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Target,
    ArrowLeft,
    Share2,
    DollarSign,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Zap
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { GoalDetailSkeleton } from '../../components/ui/Skeletons';
import { useToast } from '../../contexts/ToastContext';
import { extractApiErrorMessage, toUserSafeError } from '../../utils/userError';
import { formatCurrency } from '../../utils/formatting';

export const GoalDetail: React.FC = () => {
    const { goalId } = useParams<{ goalId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [goal, setGoal] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [contributorName, setContributorName] = useState(user?.name || '');
    const [contributing, setContributing] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [goalContributions, setGoalContributions] = useState<any[]>([]);

    useEffect(() => {
        if (goalId) {
            fetchGoal();
        }
    }, [goalId]);

    const fetchGoalContributions = async (id: string) => {
        try {
            const contribResponse = await api.get(`/social/goals/${id}/contributions`);
            setGoalContributions(contribResponse.data || []);
            return;
        } catch (_err) {
            // Fall back to legacy endpoint shape.
        }

        try {
            const contribResponse = await api.get(`/social/goals/contributions?goal_id=${id}`);
            setGoalContributions(contribResponse.data || []);
        } catch (_err) {
            setGoalContributions([]);
        }
    };

    const fetchGoal = async () => {
        setLoading(true);
        setError(null);
        try {
            let found: any = null;

            // Preferred endpoint.
            try {
                const byID = await api.get(`/social/goals/${goalId}`);
                found = byID.data;
            } catch (_err) {
                // Fallback to list endpoint.
                const response = await api.get('/social/goals');
                found = response.data.find((g: any) => g.id === goalId);
            }

            if (!found) throw new Error('Goal not found');
            setGoal(found);

            if (found?.id) {
                await fetchGoalContributions(found.id);
            }
        } catch (err: any) {
            const message = toUserSafeError(extractApiErrorMessage(err), 'Unable to load this goal right now.');
            setError(message);
            setGoal(null);
        } finally {
            setLoading(false);
        }
    };

    const handleContribute = async (e: React.FormEvent) => {
        e.preventDefault();
        setContributing(true);
        setError(null);
        try {
            await api.post('/social/goals/contribute', {
                goal_id: goalId,
                contributor_name: contributorName,
                amount: parseFloat(contributeAmount),
                currency: goal.currency
            });
            setSuccessMsg('Contribution successful! Thank you for your support.');
            setContributeAmount('');
            fetchGoal(); // Refresh
        } catch (err: any) {
            setError(toUserSafeError(extractApiErrorMessage(err), 'Could not process your contribution. Please try again.'));
        } finally {
            setContributing(false);
        }
    };

    const handleEject = async () => {
        if (!window.confirm('Are you sure you want to trigger the Ejection Protocol? This will withdraw all raised funds to your connected external wallet.')) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/social/goals/eject', { goal_id: goalId });
            showToast('success', response.data?.message || 'Funds withdrawn successfully.');
            fetchGoal(); // Refresh to see status change
        } catch (err: any) {
            setError(toUserSafeError(extractApiErrorMessage(err), 'Could not withdraw funds right now.'));
        } finally {
            setLoading(false);
        }
    };

    const handleShareGoal = async () => {
        const shareUrl = goal?.share_link || `${APP_BASE_URL}/goals/${goalId}`;
        const shareText = `Support "${goal?.title || 'this goal'}" on Corridor.`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: goal?.title || 'Corridor Goal',
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            showToast('success', 'Goal link copied to clipboard.');
        } catch (_err) {
            showToast('error', 'Could not open share right now. Copy the URL from your browser and try again.');
        }
    };

    if (loading) return (
        <GoalDetailSkeleton />
    );

    if (!goal) return (
        <div className="text-center py-20 px-4">
            <p className="text-red-500 font-bold text-xl mb-4">Goal not found</p>
            <button onClick={() => navigate('/goals')} className="text-blue-600 font-bold hover:underline">Back to Goals</button>
        </div>
    );

    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-10">
                <button
                    onClick={() => navigate('/goals')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Goals
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleShareGoal}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="Share goal"
                    >
                        <Share2 size={20} />
                    </button>
                    {goal.account_id === user?.id && (
                        <button
                            onClick={handleEject}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                        >
                            <TrendingUp size={18} />
                            Ejection Protocol (Withdraw)
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Goal Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50">
                        {/* Hero Image / Header */}
                        <div className="relative h-64 bg-slate-50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Target size={120} className="text-white/10" />
                            </div>
                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                <h1 className="text-4xl font-black mb-2 tracking-tight">{goal.title}</h1>
                                <div className="flex items-center gap-4 text-white/80 font-bold text-sm">
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} />
                                        Created {new Date(goal.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ShieldCheck size={16} className="text-blue-300" />
                                        Verified Goal
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">About this goal</h3>
                                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                    {goal.description || 'No description provided.'}
                                </p>
                            </div>

                            {goal.product_link && (
                                <a
                                    href={goal.product_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <ExternalLink size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Product Link</p>
                                            <p className="font-bold text-slate-900">View item on official store</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </a>
                            )}

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Contributors</h3>
                                <div className="space-y-4">
                                    {goalContributions && goalContributions.length > 0 ? (
                                        goalContributions.slice(0, 5).map((c: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                                        {(c.contributor_name || 'A')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{c.contributor_name || 'Anonymous'}</p>
                                                        <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-emerald-600">+{c.currency} {c.amount}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-slate-400 text-sm font-medium pt-2">No contributions yet. Be the first to support this goal!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Funding Card */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl shadow-slate-200/50 sticky top-8">
                        <div className="space-y-6 mb-10">
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-slate-900">
                                    {formatCurrency(goal.current_amount, goal.currency)}
                                </span>
                                <span className="text-slate-400 font-bold mb-1">raised of {formatCurrency(goal.target_amount, goal.currency)}</span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Supporters</p>
                                    <p className="text-xl font-black text-slate-900">{goalContributions?.length || 0}</p>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Progress</p>
                                    <p className="text-xl font-black text-slate-900">{progress.toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>

                        {successMsg ? (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-6 rounded-3xl flex flex-col items-center gap-4 text-center animate-bounce-short">
                                <CheckCircle size={40} />
                                <p className="font-bold">{successMsg}</p>
                                <button onClick={() => setSuccessMsg(null)} className="text-sm underline font-bold mt-2">Contribute again</button>
                            </div>
                        ) : (
                            <form onSubmit={handleContribute} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Your Contribution</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{goal.currency}</div>
                                        <input
                                            type="number"
                                            value={contributeAmount}
                                            onChange={(e) => setContributeAmount(e.target.value)}
                                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-xl"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        value={contributorName}
                                        onChange={(e) => setContributorName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm"
                                        placeholder="Display name (optional)"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={contributing || !contributeAmount}
                                    className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    {contributing ? (
                                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Zap size={20} className="group-hover:animate-pulse" />
                                            Support Goal
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Instant Settlement • Zero platform Fees
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
