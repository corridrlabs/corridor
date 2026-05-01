import React, { useState } from 'react';
import { Link as LinkIcon, Plus, Copy, ExternalLink, Loader2, Trash2, CheckCircle2, ShieldCheck, Search, Filter, RefreshCw, Send, DollarSign, ArrowUpRight, Clock, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentLinksApi } from '../api/paymentLinks';

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; icon: React.FC<any>; color: string; loading?: boolean }> = ({
    label, value, icon: Icon, color, loading
}) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-6 group hover:translate-y-[-4px] transition-all duration-300">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
            <p className="text-3xl font-black text-slate-900 truncate tracking-tight">{loading ? '...' : value}</p>
        </div>
    </div>
);

const PaymentLinks = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', amount: '', currency: 'KES' });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const queryClient = useQueryClient();

    const { data: links = [], isLoading } = useQuery({
        queryKey: ['payment-links'],
        queryFn: paymentLinksApi.list
    });

    const createMutation = useMutation({
        mutationFn: paymentLinksApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-links'] });
            setShowCreate(false);
            setNewLink({ title: '', amount: '', currency: 'KES' });
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            title: newLink.title,
            amount: parseFloat(newLink.amount),
            currency: newLink.currency
        });
    };

    const handleCopy = (slug: string, id: string) => {
        const url = `${window.location.origin}/pay/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const linksList = Array.isArray(links) ? links : [];
    const filteredLinks = linksList.filter(link => 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        link.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalVolume = linksList.reduce((sum, link) => sum + (link.payments_count * link.amount), 0);
    const totalViews = linksList.reduce((sum, link) => sum + (link.views || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-12 px-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-6 border shadow-sm">
                        <Send size={14} strokeWidth={3} />
                        Payment Links Active
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Payment Links</h1>
                    <p className="text-slate-500 font-medium mt-4 text-xl tracking-tight max-w-2xl">One-click payments. Create instant links and share them anywhere.</p>
                </div>
                <div className="flex flex-wrap gap-5">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-4 px-12 py-6 text-xs font-black uppercase tracking-[0.25em] text-white bg-emerald-600 rounded-[1.75rem] hover:bg-emerald-700 transition-all shadow-[0_24px_48px_-12px_rgba(16,185,129,0.4)] active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Create Link
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <StatCard label="Total Payments" value={`KES ${totalVolume.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-600" loading={isLoading} />
                <StatCard label="Total Views" value={String(totalViews)} icon={ArrowUpRight} color="bg-blue-500/10 text-blue-600" loading={isLoading} />
                <StatCard label="Active Links" value={String(linksList.length)} icon={LinkIcon} color="bg-slate-900 text-white" loading={isLoading} />
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.1)] overflow-hidden">
                {/* Search Toolbar */}
                <div className="px-12 py-12 flex flex-col md:flex-row items-center gap-10 border-b border-slate-50">
                    <div className="relative flex-1 group">
                        <Search size={26} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by title or link..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-20 pr-10 py-7 text-sm font-bold bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 placeholder:font-medium shadow-inner"
                        />
                    </div>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['payment-links'] })}
                        className="p-7 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-2xl hover:shadow-emerald-100 rounded-[2.5rem] border border-slate-50 transition-all active:scale-95">
                        <RefreshCw size={28} strokeWidth={2.5} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Grid View */}
                <div className="p-12 min-h-[600px] bg-slate-50/10">
                    {isLoading ? (
                        <div className="py-60 text-center">
                            <Loader2 size={80} className="animate-spin mx-auto mb-12 text-emerald-500/10" />
                            <p className="font-black uppercase tracking-[0.6em] text-[10px] text-slate-300">Loading payment links...</p>
                        </div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="py-40 text-center px-12">
                            <div className="w-40 h-40 bg-slate-50 rounded-[4rem] flex items-center justify-center mx-auto mb-14 shadow-inner border border-slate-100 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <LinkIcon size={72} className="text-slate-200 group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">No Links</h3>
                            <p className="text-slate-500 mt-6 max-w-xl mx-auto font-medium leading-relaxed text-xl tracking-tight">Create your first payment link to start receiving payments.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredLinks.map((link: any) => (
                                <div key={link.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-10 group hover:translate-y-[-8px] transition-all duration-500">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-slate-100 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            <LinkIcon size={28} />
                                        </div>
                                        <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border shadow-sm ${link.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            {link.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-2xl text-slate-900 mb-2 truncate tracking-tight group-hover:text-emerald-600 transition-colors">{link.title}</h3>
                                    <div className="flex items-baseline gap-2 mb-8">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{link.currency}</span>
                                        <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                                            {link.amount.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex flex-col items-center justify-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payments</p>
                                            <p className="text-lg font-black text-slate-900">{link.payments_count || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex flex-col items-center justify-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Views</p>
                                            <p className="text-lg font-black text-slate-900">{link.views || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleCopy(link.slug, link.id)}
                                            className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                                        >
                                            {copiedId === link.id ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                            {copiedId === link.id ? 'Copied' : 'Copy Link'}
                                        </button>
                                        <button className="flex-1 flex items-center justify-center p-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl hover:bg-white hover:text-emerald-600 hover:shadow-2xl hover:shadow-emerald-100 transition-all active:scale-95">
                                            <ExternalLink size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Security & Compliance Section */}
            <div className="flex flex-col items-center gap-12 pt-24 pb-48 opacity-30 grayscale hover:grayscale-0 transition-all duration-[2s] hover:opacity-100">
                <div className="flex flex-wrap items-center justify-center gap-24">
                    <div className="flex items-center gap-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">
                        <ShieldCheck size={24} className="text-emerald-500" strokeWidth={3} />
                        Verified Payments
                    </div>
                    <div className="flex items-center gap-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">
                        <ShieldCheck size={24} className="text-emerald-500" strokeWidth={3} />
                        Secure Transactions
                    </div>
                    <div className="flex items-center gap-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.5em]">
                        <ShieldCheck size={24} className="text-emerald-500" strokeWidth={3} />
                        PCI-DSS Compliant
                    </div>
                </div>
                <div className="h-px w-80 bg-gradient-to-r from-transparent via-slate-200 to-transparent shadow-sm" />
            </div>

            {/* Create Link Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[80px]" onClick={() => setShowCreate(false)} />
                    <div className="relative bg-white rounded-[5rem] shadow-[0_60px_200px_-40px_rgba(0,0,0,0.5)] w-full max-w-4xl p-24 z-10 animate-in fade-in zoom-in-[0.98] duration-700 border border-white/50">
                        <button onClick={() => setShowCreate(false)} className="absolute top-16 right-16 p-6 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-[3rem] transition-all border border-transparent hover:border-slate-100 active:scale-90">
                            <X size={32} strokeWidth={2.5} />
                        </button>
                        
                        <div className="mb-20">
                            <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-12 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.5)] border-[8px] border-emerald-100">
                                <LinkIcon size={40} className="text-white" strokeWidth={2.5} />
                            </div>
                            <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">New Payment Link</h2>
                            <p className="text-slate-500 text-2xl font-medium mt-6 tracking-tight max-w-xl">Create a link to receive payments easily.</p>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Link Name</label>
                                     <input
                                        type="text"
                                        required
                                        value={newLink.title}
                                        onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                                        placeholder="e.g. Masterclass Access"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Currency</label>
                                        <select
                                            value={newLink.currency}
                                            onChange={e => setNewLink({ ...newLink, currency: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="KES">KES</option>
                                            <option value="NGN">NGN</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Amount</label>
                                        <input
                                            type="number"
                                            required
                                            value={newLink.amount}
                                            onChange={e => setNewLink({ ...newLink, amount: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8 pt-12">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-8 bg-slate-50 text-slate-500 text-[12px] font-black uppercase tracking-[0.4em] rounded-[2.5rem] hover:bg-slate-100 transition-all border border-slate-100 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isLoading}
                                    className="flex-[3] py-8 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2.5rem] hover:bg-slate-800 transition-all shadow-[0_30px_60px_-20px_rgba(15,23,42,0.4)] flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50 border border-slate-800 group">
                                    {createMutation.isLoading ? <Loader2 size={32} className="animate-spin" /> : <ShieldCheck size={32} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />}
                                    Create Link
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentLinks;
