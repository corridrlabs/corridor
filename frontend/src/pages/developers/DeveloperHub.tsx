import React, { useState, useEffect, useMemo } from 'react';
import { 
    Key, 
    Globe, 
    Activity, 
    Bot, 
    Plus, 
    Shield, 
    Copy, 
    Eye, 
    EyeOff, 
    Check, 
    Trash2, 
    Code2, 
    Terminal, 
    Play,
    BookOpen,
    ExternalLink,
    ChevronRight,
    Loader2,
    X,
    CheckCircle2,
    XCircle,
    Lock,
    Unlock,
    Zap
} from 'lucide-react';
import { accountApi } from '../../api/account';
import api from '../../api/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://corridor-api.onrender.com';

type DevTab = 'keys' | 'webhooks' | 'docs' | 'sandbox' | 'mcp';

// ─── UTILS ───────────────────────────────────────────────────────────────────
const useCopy = () => {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };
    return { copied, copy };
};

const methodBadge = (method: string) => {
    const colors: Record<string, string> = {
        GET:    'bg-emerald-100 text-emerald-700',
        POST:   'bg-blue-100 text-blue-700',
        PUT:    'bg-amber-100 text-amber-700',
        DELETE: 'bg-red-100 text-red-700',
        PATCH:  'bg-purple-100 text-purple-700',
    };
    return colors[method] || 'bg-slate-100 text-slate-700';
};

// ─── TAB: API KEYS ────────────────────────────────────────────────────────────
const ApiKeysTab: React.FC = () => {
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creating, setCreating] = useState(false);
    const [revealedId, setRevealedId] = useState<string | null>(null);
    const { copied, copy } = useCopy();

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const data = await accountApi.getApiKeys();
            setKeys(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKeys(); }, []);

    const createKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await accountApi.createApiKey({ name: newKeyName });
            setNewKeyName('');
            setShowModal(false);
            fetchKeys();
        } catch (e) {
            alert('Failed to create key');
        } finally {
            setCreating(false);
        }
    };

    const revokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
        try {
            await accountApi.revokeApiKey(id);
            fetchKeys();
        } catch (e) {
            alert('Failed to revoke key');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">API Keys</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Authenticate requests to the Corridor API with secret keys.</p>
                </div>
                <button onClick={() => setShowModal(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
                    <Plus size={15} /> Create Key
                </button>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                    <strong>Keep your secret keys secure.</strong> Do not share them publicly or commit to version control. Rotate keys regularly and use test keys in development.
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 size={24} className="animate-spin mr-3" /> Loading keys...</div>
            ) : keys.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Key size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-700 mb-1">No API keys yet</p>
                    <p className="text-sm text-slate-400 mb-5">Create a key to start making authenticated requests</p>
                    <button onClick={() => setShowModal(true)} className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700">
                        Create First Key
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Name', 'Key prefix', 'Mode', 'Created', 'Last used', ''].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {keys.map(k => (
                                <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4 font-semibold text-slate-800">{k.name || 'Unnamed'}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <code className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                                {revealedId === k.id ? k.prefix : `${k.prefix.slice(0, 8)}••••••••`}
                                            </code>
                                            <button onClick={() => setRevealedId(revealedId === k.id ? null : k.id)}
                                                className="text-slate-400 hover:text-slate-600 transition-colors">
                                                {revealedId === k.id ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                            <button onClick={() => copy(k.prefix, k.id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                {copied === k.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${k.is_live ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {k.is_live ? 'Live' : 'Test'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{new Date(k.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => revokeKey(k.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Key Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Create New API Key</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={createKey} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Key Name</label>
                                <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                    placeholder="e.g. Production Mobile App" required autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                    A name helps you identify where the key is being used. You can always revoke a key if it's no longer needed.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── TAB: WEBHOOKS ────────────────────────────────────────────────────────────
const WEBHOOK_EVENTS = [
    'payment.created', 'payment.success', 'payment.failed',
    'invoice.issued', 'invoice.paid',
    'payout.initiated', 'payout.completed',
];

const WebhooksTab: React.FC = () => {
    const [hooks, setHooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHooks = async () => {
        setLoading(true);
        try {
            const data = await accountApi.getWebhooks();
            setHooks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHooks(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Webhooks</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Receive real-time notifications when events happen in your account.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
                    <Plus size={15} /> Add Endpoint
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 size={24} className="animate-spin mr-3" /> Loading webhooks...</div>
            ) : hooks.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Globe size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-700 mb-1">No webhooks configured</p>
                    <p className="text-sm text-slate-400 mb-5">Configure an endpoint to receive automated event alerts</p>
                    <button className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700">
                        Add Webhook Endpoint
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    {/* List hooks here */}
                </div>
            )}

            <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-4">Supported Events</h3>
                <div className="flex flex-wrap gap-2">
                    {WEBHOOK_EVENTS.map(e => (
                        <span key={e} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono border border-slate-200">{e}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── TAB: API DOCS ────────────────────────────────────────────────────────────
const ALL_ENDPOINTS = [
    { method: 'POST', path: '/api/v1/payments', desc: 'Create a new payment intent', group: 'Payments', body: { amount: 100, currency: 'USD', description: 'Test' } },
    { method: 'GET',  path: '/api/v1/payments/:id', desc: 'Retrieve payment details', group: 'Payments' },
    { method: 'POST', path: '/api/v1/invoices', desc: 'Issue a new invoice', group: 'Invoices', body: { customer_id: 'cust_123', items: [{ name: 'SaaS Plan', amount: 50 }] } },
    { method: 'GET',  path: '/api/v1/invoices', desc: 'List all invoices', group: 'Invoices' },
    { method: 'GET',  path: '/api/v1/wallets', desc: 'Get wallet balances', group: 'Wallets' },
    { method: 'POST', path: '/api/v1/wallets/transfer', desc: 'Transfer funds between wallets', group: 'Wallets', body: { from: 'main', to: 'savings', amount: 10 } },
];

const DocsTab: React.FC = () => {
    const { copied, copy } = useCopy();
    const [selected, setSelected] = useState(ALL_ENDPOINTS[0]);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; payload: unknown } | null>(null);
    const [bodyText, setBodyText] = useState('');
    const baseUrl = (API_BASE_URL || '').replace(/\/$/, '');

    useEffect(() => {
        setBodyText(selected.body ? JSON.stringify(selected.body, null, 2) : '');
        setResult(null);
    }, [selected]);

    const groups = useMemo(() => {
        const map: Record<string, typeof ALL_ENDPOINTS> = {};
        ALL_ENDPOINTS.forEach(e => { (map[e.group] = map[e.group] || []).push(e); });
        return map;
    }, []);

    const curlCmd = useMemo(() => {
        const bodyPart = selected.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText}'` : '';
        return `curl -X ${selected.method} "${baseUrl}${selected.path}" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"${bodyPart}`;
    }, [selected, bodyText, baseUrl]);

    const tryOut = async () => {
        setRunning(true); setResult(null);
        try {
            const localPath = selected.path.replace(/^\/api/, '');
            let parsedBody: any = undefined;
            if (selected.body && bodyText) {
                try { parsedBody = JSON.parse(bodyText); } catch { parsedBody = undefined; }
            }
            const res = await api.request({ url: localPath, method: selected.method as any, data: parsedBody });
            setResult({ ok: true, payload: res.data });
        } catch (e: any) {
            setResult({ ok: false, payload: e?.response?.data || e?.message || 'Request failed' });
        } finally { setRunning(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 min-h-[600px]">
            {/* Endpoint sidebar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500">Endpoints</p>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                    {Object.entries(groups).map(([grp, eps]) => (
                        <div key={grp}>
                            <p className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-50/50 border-t border-slate-50 first:border-0">{grp}</p>
                            {eps.map((ep, i) => (
                                <button key={i} onClick={() => setSelected(ep)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${selected === ep ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${methodBadge(ep.method)}`}>{ep.method}</span>
                                    <span className="text-xs font-mono text-slate-700 truncate">{ep.path}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail panel */}
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg font-mono ${methodBadge(selected.method)}`}>{selected.method}</span>
                        <code className="text-sm font-mono text-slate-800 flex-1">{selected.path}</code>
                        <button onClick={() => copy(curlCmd, 'curl')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            {copied === 'curl' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Copy cURL
                        </button>
                    </div>
                    <p className="text-sm text-slate-500">{selected.desc}</p>
                </div>

                {/* Body editor */}
                {selected.body && (
                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                            <span className="text-xs font-semibold text-slate-400">Request Body (editable)</span>
                            <span className="text-xs text-slate-500">JSON</span>
                        </div>
                        <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={8}
                            spellCheck={false}
                            className="w-full bg-transparent text-green-400 font-mono text-xs p-5 focus:outline-none resize-none" />
                    </div>
                )}

                {/* cURL preview */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Terminal size={13} className="text-slate-500" />
                            <span className="text-xs font-semibold text-slate-400">cURL</span>
                        </div>
                        <button onClick={() => copy(curlCmd, 'curl2')} className="text-slate-500 hover:text-white transition-colors">
                            {copied === 'curl2' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                    <pre className="p-5 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap"><code>{curlCmd}</code></pre>
                </div>

                {/* Try it out */}
                <button onClick={tryOut} disabled={running}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-blue-200">
                    {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {running ? 'Sending Request...' : 'Send Request'}
                </button>

                {/* Response */}
                {result && (
                    <div className={`rounded-2xl overflow-hidden shadow-sm border ${result.ok ? 'border-green-200' : 'border-red-200'}`}>
                        <div className={`flex items-center gap-2 px-5 py-3 ${result.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                            {result.ok ? <CheckCircle2 size={15} className="text-green-600" /> : <XCircle size={15} className="text-red-600" />}
                            <span className={`text-xs font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
                                {result.ok ? 'Success' : 'Error'}
                            </span>
                        </div>
                        <pre className="p-5 bg-white text-xs font-mono text-slate-700 overflow-x-auto max-h-64">
                            <code>{JSON.stringify(result.payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── TAB: SANDBOX ─────────────────────────────────────────────────────────────
const scenarios = [
    {
        id: 'list_wallets',
        name: 'Check Wallet Balances',
        desc: 'Fetch all wallets associated with your account',
        method: 'GET', path: '/wallets', body: null,
        tag: 'Wallets',
    },
    {
        id: 'create_goal',
        name: 'Create a Social Goal',
        desc: 'Create a crowdfunding goal with a share link',
        method: 'POST', path: '/social/goals',
        body: { title: 'Test Goal', description: 'A sandbox goal', target_amount: 100, currency: 'USD' },
        tag: 'Social',
    },
    {
        id: 'list_goals',
        name: 'List Goals',
        desc: 'Fetch all active social goals',
        method: 'GET', path: '/social/goals', body: null,
        tag: 'Social',
    },
    {
        id: 'list_employees',
        name: 'List Employees',
        desc: 'Fetch your payroll employee roster',
        method: 'GET', path: '/employees', body: null,
        tag: 'Payroll',
    },
    {
        id: 'list_keys',
        name: 'List API Keys',
        desc: 'Fetch all your API keys',
        method: 'GET', path: '/api-keys', body: null,
        tag: 'Developer',
    },
    {
        id: 'list_webhooks',
        name: 'List Webhooks',
        desc: 'Fetch all registered webhook endpoints',
        method: 'GET', path: '/webhooks', body: null,
        tag: 'Developer',
    },
    {
        id: 'list_invoices',
        name: 'List Invoices',
        desc: 'Get your invoice list',
        method: 'GET', path: '/invoices', body: null,
        tag: 'Billing',
    },
];

const SandboxTab: React.FC = () => {
    const [selected, setSelected] = useState(scenarios[0]);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; data: any; time: number } | null>(null);

    const run = async () => {
        setRunning(true); setResult(null);
        const t = Date.now();
        try {
            const res = await api.request({ url: selected.path, method: selected.method as any, data: selected.body ?? undefined });
            setResult({ ok: true, data: res.data, time: Date.now() - t });
        } catch (e: any) {
            setResult({ ok: false, data: e?.response?.data || e?.message, time: Date.now() - t });
        } finally { setRunning(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">API Sandbox</h2>
                <p className="text-sm text-slate-500">Test real API calls against your live account with one click.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                {/* Scenario list */}
                <div className="space-y-2">
                    {scenarios.map(s => (
                        <button key={s.id} onClick={() => { setSelected(s); setResult(null); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${selected.id === s.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-400">{s.tag}</span>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${methodBadge(s.method)}`}>{s.method}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Run panel */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${methodBadge(selected.method)}`}>{selected.method}</span>
                            <code className="text-sm font-mono text-slate-700">/api{selected.path}</code>
                        </div>
                        <p className="text-sm text-slate-500">{selected.desc}</p>

                        {selected.body && (
                            <div className="mt-4 bg-slate-900 rounded-xl p-4">
                                <p className="text-xs text-slate-400 mb-2 font-mono">Request Body</p>
                                <pre className="text-xs text-green-400 font-mono"><code>{JSON.stringify(selected.body, null, 2)}</code></pre>
                            </div>
                        )}
                    </div>

                    <button onClick={run} disabled={running}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-blue-200">
                        {running ? <><Loader2 size={16} className="animate-spin" /> Running...</> : <><Play size={16} /> Run Test</>}
                    </button>

                    {result && (
                        <div className={`rounded-2xl overflow-hidden shadow-sm border ${result.ok ? 'border-green-200' : 'border-red-200'}`}>
                            <div className={`flex items-center justify-between px-5 py-3 ${result.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="flex items-center gap-2">
                                    {result.ok ? <CheckCircle2 size={15} className="text-green-600" /> : <XCircle size={15} className="text-red-600" />}
                                    <span className={`text-xs font-semibold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.ok ? 'Success' : 'Error'}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400">{result.time}ms</span>
                            </div>
                            <pre className="p-5 bg-white text-xs font-mono text-slate-700 overflow-x-auto max-h-80">
                                <code>{JSON.stringify(result.data, null, 2)}</code>
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── TAB: MCP GUIDE ──────────────────────────────────────────────────────────
const McpTab: React.FC = () => {
    const { copied, copy } = useCopy();
    const snippets = [
        { id: 'install', label: 'Build MCP Server', code: `cd mcp && go build -o corridor-mcp ./cmd` },
        { id: 'run', label: 'Run with your API key', code: `PAYDAY_API_KEY=ck_your_key PAYDAY_API_URL=https://corridor-api.onrender.com ./corridor-mcp` },
        { id: 'claude', label: 'Add to Claude Desktop', code: `{
  "mcpServers": {
    "corridor": {
      "command": "/path/to/corridor-mcp",
      "env": {
        "PAYDAY_API_KEY": "ck_your_corridor_api_key",
        "PAYDAY_API_URL": "https://corridor-api.onrender.com"
      }
    }
  }
}` },
    ];

    const tools = [
        { name: 'create_goal', desc: 'Create a crowdfunding social goal', args: 'title, target_amount, currency' },
        { name: 'contribute_to_goal', desc: 'Contribute funds to an existing goal', args: 'goal_id, amount, contributor_name' },
        { name: 'check_balance', desc: 'Check wallet balance for the authenticated account', args: '(none required)' },
        { name: 'send_payment', desc: 'Send a P2P payment to another user', args: 'recipient, amount, currency, message' },
        { name: 'create_invoice', desc: 'Create and issue a new invoice', args: 'customer_id, items[], currency, due_date' },
    ];

    return (
        <div className="space-y-8 max-w-3xl">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-purple-700 mb-4">
                    <Zap size={12} /> Model Context Protocol
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">MCP Integration Guide</h2>
                <p className="text-slate-500 text-sm">
                    Let AI agents like Claude control your Corridor account directly — create goals, send payments, check balances, and more — all through natural language.
                </p>
            </div>

            {/* Tools */}
            <div>
                <h3 className="font-bold text-slate-900 mb-3">Available MCP Tools</h3>
                <div className="space-y-2">
                    {tools.map(t => (
                        <div key={t.name} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <code className="text-xs font-mono bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap flex-shrink-0">{t.name}</code>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{t.desc}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Args: <span className="font-mono">{t.args}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Setup steps */}
            <div>
                <h3 className="font-bold text-slate-900 mb-4">Setup Steps</h3>
                <div className="space-y-4">
                    {snippets.map((s, i) => (
                        <div key={s.id}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black">{i + 1}</div>
                                <p className="text-sm font-bold text-slate-700">{s.label}</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                                    <span className="text-xs text-slate-500 font-mono">bash</span>
                                    <button onClick={() => copy(s.code, s.id)} className="text-slate-500 hover:text-white transition-colors">
                                        {copied === s.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto"><code>{s.code}</code></pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API key note */}
            <div className="flex items-start gap-3 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <Lock size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Get an API Key first</p>
                    <p className="text-xs text-blue-700">Go to the <strong>API Keys</strong> tab to create a key. Use a test key for development and a live key in production.</p>
                </div>
            </div>
        </div>
    );
};

// ─── MAIN DEVELOPER HUB ───────────────────────────────────────────────────────
const tabs: { id: DevTab; label: string; icon: React.ReactNode }[] = [
    { id: 'keys',     label: 'API Keys',   icon: <Key size={15} /> },
    { id: 'webhooks', label: 'Webhooks',   icon: <Globe size={15} /> },
    { id: 'docs',     label: 'API Docs',   icon: <Code2 size={15} /> },
    { id: 'sandbox',  label: 'Sandbox',    icon: <Activity size={15} /> },
    { id: 'mcp',      label: 'MCP Guide',  icon: <Bot size={15} /> },
];

export const DeveloperHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DevTab>('keys');

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full mb-3">
                        <Terminal size={12} /> Developer Hub
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Build with Corridor</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate keys, configure webhooks, explore the API, and integrate Corridor payments into your systems.</p>
                </div>
                <a href="https://github.com/corridrlabs/corridor" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all whitespace-nowrap flex-shrink-0">
                    <ExternalLink size={14} /> View on GitHub
                </a>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'REST Endpoints', value: `${ALL_ENDPOINTS.length}+`, icon: <Globe size={15} /> },
                    { label: 'Webhook Events', value: `${WEBHOOK_EVENTS.length}`, icon: <Zap size={15} /> },
                    { label: 'MCP Tools', value: '5', icon: <Bot size={15} /> },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">{s.icon}</div>
                        <div>
                            <p className="text-lg font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                                activeTab === t.id
                                    ? 'text-slate-900 border-b-2 border-slate-900 bg-slate-50/50'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    {activeTab === 'keys'     && <ApiKeysTab />}
                    {activeTab === 'webhooks' && <WebhooksTab />}
                    {activeTab === 'docs'     && <DocsTab />}
                    {activeTab === 'sandbox'  && <SandboxTab />}
                    {activeTab === 'mcp'      && <McpTab />}
                </div>
            </div>
        </div>
    );
};
