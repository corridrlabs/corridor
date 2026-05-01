import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Target, DollarSign, ChevronRight, Share2, Wallet, ArrowUpRight, CheckCircle2, SplitSquareVertical, Award } from 'lucide-react';
import api from '../services/api';
import { GenericPageSkeleton } from '../components/ui/Skeletons';
import { formatCurrency } from '../utils/formatting';
import { useToast } from '../contexts/ToastContext';

interface GroupGoal {
    id: string;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    status?: string;
    share_link?: string;
}

interface Chama {
    id: string;
    name: string;
    description?: string;
    total_payout_goal: number;
    currency: string;
    status: string;
    share_link: string;
    created_at: string;
}

interface SplitBill {
    id: string;
    title: string;
    description?: string;
    total_amount: number;
    currency: string;
    status: string;
    share_link: string;
}

type SocialCategory = 'goals' | 'chamas' | 'splits';

export default function GroupPayments() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [category, setCategory] = useState<SocialCategory>('goals');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        goals: GroupGoal[];
        chamas: Chama[];
        splits: SplitBill[];
    }>({ goals: [], chamas: [], splits: [] });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [goalsRes, chamasRes, splitsRes] = await Promise.all([
                api.get('/social/goals'),
                api.get('/chamas'),
                api.get('/split')
            ]);
            
            setData({
                goals: Array.isArray(goalsRes?.data) ? goalsRes.data : [],
                chamas: Array.isArray(chamasRes?.data) ? chamasRes.data : [],
                splits: Array.isArray(splitsRes?.data) ? splitsRes.data : []
            });
        } catch (err: any) {
            console.error('Failed to load social finance data:', err);
            setError('Failed to load your social finance dashboard.');
        } finally {
            setLoading(false);
        }
    };

    const copyShareLink = (e: React.MouseEvent, link: string) => {
        e.stopPropagation();
        if (!link) return;
        navigator.clipboard.writeText(link);
        showToast('success', 'Safe share link copied!');
    };

    if (loading) {
        return <GenericPageSkeleton cardRows={6} />;
    }

    const currentItems = data[category];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
                        <Users className="h-3.5 w-3.5" />
                        Collective Finance
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Social Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Pool funds, manage group savings, and split costs with trust.
                    </p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex p-1.5 bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl w-fit border border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'goals', label: 'Crowdfunding', icon: Target },
                        { id: 'chamas', label: 'Manage Chamas', icon: Award },
                        { id: 'splits', label: 'Split Bills', icon: SplitSquareVertical },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCategory(tab.id as SocialCategory)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                category === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (category === 'goals') navigate('/goals/new');
                        else if (category === 'chamas') navigate('/chama/new');
                        else if (category === 'splits') navigate('/split/new');
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95 group ${
                        category === 'goals' ? 'bg-orange-600 shadow-orange-200' : 
                        category === 'chamas' ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'
                    }`}
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Create {category === 'goals' ? 'Crowdfunding Goal' : category === 'chamas' ? 'Savings Chama' : 'Split Request'}
                </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-300 dark:border-gray-800">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nothing yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs text-center">
                            Start a new {category.slice(0, -1)} session to see it here.
                        </p>
                    </div>
                ) : (
                    currentItems.map((item: any) => (
                        <div 
                            key={item.id}
                            className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[320px]"
                            onClick={() => navigate(category === 'goals' ? `/goals/${item.id}` : category === 'chamas' ? `/chama/${item.id}` : `/split/${item.id}`)}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-4 rounded-2xl ${
                                        category === 'goals' ? 'bg-orange-50 text-orange-600' : 
                                        category === 'chamas' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {category === 'goals' ? <Target size={24} /> : category === 'chamas' ? <Award size={24} /> : <SplitSquareVertical size={24} />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => copyShareLink(e, item.share_link)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                    {item.title || item.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {item.description || "Collective finance initiative powered by Corridor platform protocols."}
                                </p>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                            {category === 'goals' ? 'Raised' : 'Current Pool'}
                                        </p>
                                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                                            {formatCurrency(item.current_amount || 0, item.currency)}
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Target</p>
                                        <h4 className="text-lg font-bold text-gray-500">
                                            {formatCurrency(item.target_amount || item.total_amount || item.total_payout_goal || 0, item.currency)}
                                        </h4>
                                    </div>
                                </div>

                                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            category === 'goals' ? 'bg-orange-500' : 
                                            category === 'chamas' ? 'bg-purple-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${Math.max(5, ((item.current_amount || 0) / (item.target_amount || item.total_amount || item.total_payout_goal || 1)) * 100)}%` }}
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter pt-2">
                                    <span className="text-gray-400">Status: {item.status || 'Active'}</span>
                                    <span className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform">
                                        View Details <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
