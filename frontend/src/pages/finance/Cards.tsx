import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Plus,
    ArrowUpRight,
    Shield,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Smartphone,
    Globe,
    Wallet as WalletIcon,
    Copy,
    ExternalLink,
    ChevronRight,
    Search,
    CreditCard as CardIcon
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface FundingSource {
    id: string;
    type: 'CARD' | 'MPESA' | 'STRIPE' | 'PAYPAL';
    last4?: string;
    expiry?: string;
    brand?: string;
    status: string;
}

interface SolanaDepositInfo {
    address: string;
    memo: string;
}

const Cards = () => {
    const { showToast } = useToast();
    const [sources, setSources] = useState<FundingSource[]>([]);
    const [solanaInfo, setSolanaInfo] = useState<SolanaDepositInfo | null>(null);
    const [selectedSource, setSelectedSource] = useState<FundingSource | null>(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newSource, setNewSource] = useState({
        type: 'CARD' as FundingSource['type'],
        name: '',
        number: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        fetchSources();
        fetchSolanaInfo();
    }, []);

    const fetchSources = async () => {
        setLoading(true);
        try {
            const response = await api.get('/funding-sources');
            const payload = Array.isArray(response?.data) ? response.data : [];
            setSources(payload);
            if (payload.length > 0) {
                setSelectedSource(payload[0]);
            }
        } catch (err: any) {
            console.error('Failed to fetch funding sources:', err);
            const backendMessage =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : '');
            if (backendMessage) {
                showToast('error', backendMessage);
            }
            setSources([]);
            setSelectedSource(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolanaInfo = async () => {
        try {
            const response = await api.get('/onramp/solana');
            setSolanaInfo(response.data);
        } catch (err) {
            console.error('Failed to fetch Solana deposit info:', err);
        }
    };

    const handleTopUp = async () => {
        if (!selectedSource || !topUpAmount) return;
        setLoading(true);

        try {
            await api.post('/fund-wallet', {
                source_id: selectedSource.id,
                amount: parseFloat(topUpAmount),
                currency: 'USD'
            });
            showToast('success', `Successfully pulled $${topUpAmount} from your ${selectedSource.type} into your Corridor wallet.`);
            setTopUpAmount('');
            fetchSources(); // Refresh balances if needed
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to process top-up. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async () => {
        if (newSource.type === 'CARD' && (!newSource.number || !newSource.expiry)) {
            showToast('error', 'Please fill in card details');
            return;
        }
        if (newSource.type === 'MPESA' && !newSource.number) {
            showToast('error', 'Please enter M-Pesa phone number');
            return;
        }

        setIsSaving(true);
        try {
            const last4 = newSource.number.slice(-4);
            const payload = {
                type: newSource.type,
                last4: last4,
                brand: newSource.type === 'CARD' ? 'Visa' : 'M-Pesa',
                external_id: newSource.number,
                status: 'ACTIVE'
            };

            await api.post('/funding-sources', payload);
            showToast('success', `${newSource.type === 'CARD' ? 'Card' : 'M-Pesa account'} connected successfully!`);
            setShowAddModal(false);
            setNewSource({ type: 'CARD', name: '', number: '', expiry: '', cvv: '' });
            fetchSources();
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Failed to connect source');
        } finally {
            setIsSaving(false);
        }
    };
    
    const openAddModal = (type: FundingSource['type'] = 'CARD') => {
        setNewSource(prev => ({ ...prev, type }));
        setShowAddModal(true);
    };

    const handleCopy = (text: string, type: 'address' | 'memo') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const clsx = (...classes: any[]) => classes.filter(Boolean).join(' ');

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-20 md:pt-8 bg-[radial-gradient(circle_at_50%_0%,_#1a1a2e_0%,_transparent_50%)]">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Funding Sources
                    </h1>
                    <p className="text-gray-400 mt-1">Manage where your borderless money comes from</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Quick Top-up */}
                    <div className="space-y-6">
                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                                    Quick Top-up
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {(Array.isArray(sources) ? sources : []).length > 0 ? (
                                    <>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Choose Source</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {(Array.isArray(sources) ? sources : []).map(source => (
                                                    <button
                                                        key={source.id}
                                                        onClick={() => setSelectedSource(source)}
                                                        className={clsx(
                                                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                                                            selectedSource?.id === source.id
                                                                ? "bg-blue-600/20 border-blue-500/50"
                                                                : "bg-white/5 border-white/5 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                                                                {source.type === 'CARD' ? <CreditCard className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-medium">{source.brand || source.type}</p>
                                                                {source.last4 && <p className="text-xs text-gray-500">•••• {source.last4}</p>}
                                                            </div>
                                                        </div>
                                                        {selectedSource?.id === source.id && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Amount (USD)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                <input
                                                    type="number"
                                                    value={topUpAmount}
                                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleTopUp}
                                            disabled={loading || !topUpAmount}
                                            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pull Funds Now'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                            <Plus className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-400">No funding sources connected</p>
                                        <button
                                            onClick={() => openAddModal('CARD')}
                                            className="mt-4 text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 mx-auto"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Connect your first source
                                        </button>
                                    </div>
                                )}
                            </div>

                            {status && (
                                <div className={clsx(
                                    "mt-4 p-4 rounded-xl flex gap-3 items-start",
                                    status.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                )}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                    <p className="text-sm">{status.msg}</p>
                                </div>
                            )}
                        </section>

                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-4">
                            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Corridor simplifies borderless on-ramping. We partner with bank-level processors (Circle, Stripe, PayPal) to ensure your data stays secure. We never store your card numbers.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Methods & Solana */}
                    <div className="space-y-6">
                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <WalletIcon className="w-5 h-5 text-blue-400" />
                                Direct Crypto Deposit
                            </h2>
                            <p className="text-sm text-gray-400 mb-6 font-mono bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                Send USDC on Solana to top up your wallet instantly.
                            </p>

                            {solanaInfo ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Deposit Address</label>
                                        <div className="flex gap-2">
                                            <code className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs flex-grow font-mono truncate">
                                                {solanaInfo.address}
                                            </code>
                                            <button
                                                onClick={() => handleCopy(solanaInfo.address, 'address')}
                                                className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors border border-white/10"
                                            >
                                                {copied === 'address' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            Memo (Required)
                                            <AlertCircle className="w-3 h-3 text-orange-400" />
                                        </label>
                                        <div className="flex gap-2">
                                            <code className="bg-black/50 border border-white/10 rounded-lg p-3 text-sm flex-grow font-mono font-bold text-blue-400">
                                                {solanaInfo.memo}
                                            </code>
                                            <button
                                                onClick={() => handleCopy(solanaInfo.memo, 'memo')}
                                                className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors border border-white/10"
                                            >
                                                {copied === 'memo' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400">
                                        <strong>ATTENTION:</strong> You MUST include the correct memo when sending funds, or they won't be credited to your account automatically. Only send USDC on Solana.
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-10 bg-white/5 rounded-lg w-full"></div>
                                    <div className="h-10 bg-white/5 rounded-lg w-full"></div>
                                </div>
                            )}
                        </section>

                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h2 className="text-xl font-semibold mb-6">Payment Partners</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => openAddModal('MPESA')}
                                    className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-all text-left w-full"
                                >
                                    <Smartphone className="w-8 h-8 text-green-500" />
                                    <span className="text-sm font-medium">M-Pesa</span>
                                </button>
                                <button 
                                    onClick={() => openAddModal('CARD')}
                                    className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-all text-left w-full"
                                >
                                    <Globe className="w-8 h-8 text-blue-500" />
                                    <span className="text-sm font-medium">PayPal</span>
                                </button>
                                <button 
                                    onClick={() => openAddModal('CARD')}
                                    className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-all text-left w-full"
                                >
                                    <CreditCard className="w-8 h-8 text-indigo-500" />
                                    <span className="text-sm font-medium">Stripe</span>
                                </button>
                                <button 
                                    onClick={() => openAddModal('CARD')}
                                    className="bg-white/10 border border-white/10 border-dashed rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-white/20 transition-all text-left w-full"
                                >
                                    <Plus className="w-8 h-8 text-gray-500" />
                                    <span className="text-sm font-medium">Connect New</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Add Source Modal */}
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogContent className="sm:max-w-[425px] bg-[#0f0f15] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Connect Funding Source
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Add a secure way to fund your Corridor wallet.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="flex p-1 bg-white/5 rounded-lg">
                                <button
                                    onClick={() => setNewSource({ ...newSource, type: 'CARD' })}
                                    className={clsx(
                                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                                        newSource.type === 'CARD' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Card
                                </button>
                                <button
                                    onClick={() => setNewSource({ ...newSource, type: 'MPESA' })}
                                    className={clsx(
                                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                                        newSource.type === 'MPESA' ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    M-Pesa
                                </button>
                            </div>

                            {newSource.type === 'CARD' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">Cardholder Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={newSource.name}
                                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">Card Number</label>
                                        <div className="relative">
                                            <Input
                                                placeholder="0000 0000 0000 0000"
                                                value={newSource.number}
                                                onChange={(e) => setNewSource({ ...newSource, number: e.target.value })}
                                                className="bg-white/5 border-white/10 focus:border-blue-500/50 pl-10"
                                            />
                                            <CardIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">Expiry</label>
                                            <Input
                                                placeholder="MM/YY"
                                                value={newSource.expiry}
                                                onChange={(e) => setNewSource({ ...newSource, expiry: e.target.value })}
                                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">CVV</label>
                                            <Input
                                                placeholder="123"
                                                type="password"
                                                value={newSource.cvv}
                                                onChange={(e) => setNewSource({ ...newSource, cvv: e.target.value })}
                                                className="bg-white/5 border-white/10 focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">M-Pesa Phone Number</label>
                                        <div className="relative">
                                            <Input
                                                placeholder="+254 700 000 000"
                                                value={newSource.number}
                                                onChange={(e) => setNewSource({ ...newSource, number: e.target.value })}
                                                className="bg-white/5 border-white/10 focus:border-green-500/50 pl-10"
                                            />
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            We will send an STK Push to this number when you top up.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-400" />
                                <p className="text-[10px] text-gray-400 leading-tight">
                                    Your data is encrypted and managed by PCI-compliant partners. Corridor never stores full card numbers.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddModal(false)}
                                className="bg-transparent border-white/10 text-white hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSource}
                                disabled={isSaving}
                                className={clsx(
                                    "flex-1 font-bold",
                                    newSource.type === 'CARD' ? "bg-blue-600 hover:bg-blue-500" : "bg-green-600 hover:bg-green-500"
                                )}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect Source'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Cards;
