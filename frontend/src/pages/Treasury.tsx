import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  CreditCard,
  Download,
  ExternalLink,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Paywall from '../components/Paywall';
import { treasuryApi, WalletData } from '../api/treasury';

const FX_FALLBACKS: Record<string, number> = {
  USDC: 1,
  USD: 1,
  KES: 1 / 130,
  NGN: 1 / 1550,
  GHS: 1 / 12,
  EUR: 1.08,
  SOL: 145,
  BTC: 65000,
  ETH: 3500,
};

const Treasury = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [sweeping, setSweeping] = useState(false);

  // Safely ensure wallets is array
  const safeWallets = Array.isArray(wallets) ? wallets : [];

  const treasuryWallet = useMemo(
    () => safeWallets.find((wallet) => wallet.currency === 'USDC' && wallet.type === 'ONCHAIN_STABLE') || safeWallets.find((wallet) => wallet.currency === 'USDC') || null,
    [safeWallets],
  );

  const operationalWallets = useMemo(
    () => safeWallets.filter((wallet) => wallet.id !== treasuryWallet?.id),
    [safeWallets, treasuryWallet],
  );

  const handleSweep = async () => {
    if (!window.confirm('Sweep all non-USDC funds into the primary USDC treasury vault?')) return;
    setSweeping(true);
    try {
      const { accountApi } = await import('../api/account');
      await accountApi.runRevenueSweep();
      showToast('success', 'Revenue sweep initiated');
      await fetchWallets();
    } catch (e: any) {
      console.error(e);
      showToast('error', e.response?.data?.error || 'Failed to sweep funds');
    } finally {
      setSweeping(false);
    }
  };

  useEffect(() => {
    void fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const data = await treasuryApi.getWallets();
      const normalizedWallets = Array.isArray(data) ? data : [];
      setWallets(normalizedWallets);

      const total = normalizedWallets.reduce((acc, wallet) => {
        const rate = FX_FALLBACKS[wallet.currency] || 1;
        return acc + Number(wallet.balance || 0) * rate;
      }, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Failed to fetch wallets', error);
      showToast('error', 'Failed to load treasury data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async () => {
    try {
      await treasuryApi.createWallet('USDC');
      showToast('success', 'Treasury vault created in USDC.');
      setShowCreate(false);
      await fetchWallets();
    } catch (error: any) {
      console.error('Failed to create treasury vault', error);
      if (error.response?.status === 403) {
        setShowCreate(false);
        setShowPremiumAlert(true);
        return;
      }
      showToast('error', error.response?.data?.error || error.message || 'Failed to create vault');
    }
  };

  const handleDeleteWallet = async (wallet: WalletData) => {
    if (!window.confirm(`Delete the ${wallet.currency} wallet? This cannot be undone.`)) return;
    try {
      await treasuryApi.deleteWallet(wallet.id);
      showToast('success', `${wallet.currency} wallet deleted.`);
      await fetchWallets();
    } catch (error: any) {
      console.error('Failed to delete wallet', error);
      showToast('error', error.response?.data?.error || error.message || 'Failed to delete wallet');
    }
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    showToast('success', 'Deposit address copied');
  };

  const fundingRoutes = [
    {
      title: 'Card / Bank',
      description: 'Use the live add-funds flow for card and bank-funded top ups.',
      action: () => navigate('/add-funds'),
      icon: CreditCard,
    },
    {
      title: 'M-Pesa & Sources',
      description: 'Manage connected payment sources and quick top-ups.',
      action: () => navigate('/cards'),
      icon: Wallet,
    },
    {
      title: 'Treasury Docs',
      description: 'Read the stablecoin deposit and conversion flow.',
      action: () => navigate('/docs/businesses'),
      icon: ExternalLink,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Stablecoin Treasury
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Treasury</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Corridor now treats treasury as one USDC vault. Add money through card, M-Pesa, or crypto rails, then convert on-ledger with live FX.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Wallet
          </button>
          <button
            onClick={() => {
              if (!treasuryWallet) {
                setShowCreate(true);
                return;
              }
              setSelectedWallet(treasuryWallet);
              setShowDeposit(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Receive Money
          </button>
          <button
            onClick={handleSweep}
            disabled={sweeping}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            {sweeping ? 'Sweeping...' : 'Sweep Funds'}
          </button>
          <button
            onClick={() => setShowConvert(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Convert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Treasury vault</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">USDC on Solana</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This is the canonical wallet for Corridor treasury balances.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated USD value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {loading ? (
            <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ) : treasuryWallet ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">Primary wallet</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{treasuryWallet.currency}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    Balance: <span className="font-semibold">{Number(treasuryWallet.balance || 0).toLocaleString()}</span> {treasuryWallet.currency}
                  </p>
                  {treasuryWallet.chain_address && (
                    <div className="mt-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white/80 dark:bg-gray-900/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400 mb-2">Deposit address</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all rounded-lg bg-gray-50 dark:bg-gray-950 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                          {treasuryWallet.chain_address}
                        </code>
                        <button
                          onClick={() => void copyAddress(treasuryWallet.chain_address || '')}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-[220px]">
                  <button
                    onClick={() => {
                      setSelectedWallet(treasuryWallet);
                      setShowDeposit(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-white transition-colors hover:bg-black"
                  >
                    <Download className="h-4 w-4" />
                    Receive into vault
                  </button>
                  <button
                    onClick={() => setShowConvert(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Convert assets
                  </button>
                  <button
                    onClick={() => navigate('/add-funds')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200"
                  >
                    <Upload className="h-4 w-4" />
                    Add money
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-8 text-center">
              <Wallet className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No treasury vault yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create the stablecoin vault first. All other treasury flows attach to that wallet.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-white transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create treasury vault
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3 text-indigo-600 dark:text-indigo-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">FX</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live conversion</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Convert inbound fiat or local-rail funds into USDC using live rates. The conversion modal is now backed by the API, not mock math.
          </p>
          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">USDC / KES</span>
              <span className="font-semibold text-gray-900 dark:text-white">~129.50</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Primary rail</span>
              <span className="font-semibold text-gray-900 dark:text-white">Solana USDC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Funding routes</p>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add money or receive money</h3>
          </div>
          <Shield className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {fundingRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.title}
                onClick={route.action}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700/60 dark:hover:bg-indigo-900/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{route.title}</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{route.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {operationalWallets.length > 0 && (
        <details className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-900 dark:text-white">
            Operational wallets ({operationalWallets.length})
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {operationalWallets.map((wallet) => (
              <div key={wallet.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{wallet.currency}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{wallet.type || 'Wallet'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(wallet)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete wallet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{Number(wallet.balance || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{wallet.currency} balance</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Treasury vault</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create / ensure USDC vault</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Corridor now uses one treasury wallet: a stablecoin vault. Add money through external rails, then convert into USDC.
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600">
                <Lock className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={handleCreateVault}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition-colors hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                    <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Create vault</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Creates the USDC treasury vault or returns the existing one.</p>
              </button>

              <button
                onClick={() => {
                  setShowCreate(false);
                  navigate('/add-funds');
                }}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Fund with card</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Use the existing add-funds flow to collect card or crypto top-ups.</p>
              </button>

              <button
                onClick={() => {
                  setShowCreate(false);
                  navigate('/cards');
                }}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition-colors hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-orange-700 dark:hover:bg-orange-900/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                    <Upload className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Connect sources</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage M-Pesa and other connected funding sources.</p>
              </button>

              <button
                onClick={() => {
                  setShowCreate(false);
                  if (!treasuryWallet) {
                    setShowCreate(true);
                    return;
                  }
                  setSelectedWallet(treasuryWallet);
                  setShowDeposit(true);
                }}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                    <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Receive USDC</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Show the Solana deposit address and memo for direct USDC transfers.</p>
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeposit && selectedWallet && <DepositModal wallet={selectedWallet} onClose={() => setShowDeposit(false)} />}
      {showConvert && <ConvertModal wallets={wallets} onClose={() => setShowConvert(false)} onSuccess={fetchWallets} />}

      <Paywall
        isOpen={showPremiumAlert}
        onClose={() => setShowPremiumAlert(false)}
        onSuccess={() => {
          setShowPremiumAlert(false);
          void fetchWallets();
        }}
      />
    </div>
  );
};

const DepositModal = ({ wallet, onClose }: { wallet: WalletData; onClose: () => void }) => {
  const { showToast } = useToast();
  const [address, setAddress] = useState(wallet.address || wallet.chain_address || '');
  const [loading, setLoading] = useState(!wallet.address && !wallet.chain_address);
  const [unsupportedDeposit, setUnsupportedDeposit] = useState(false);

  useEffect(() => {
    if (wallet.address || wallet.chain_address) {
      setLoading(false);
      setAddress(wallet.address || wallet.chain_address || '');
      return;
    }

    if (!['USDC', 'SOL'].includes(wallet.currency) && wallet.type !== 'ONCHAIN_STABLE') {
      setUnsupportedDeposit(true);
      setLoading(false);
      return;
    }

    void treasuryApi.getDepositAddress(wallet.currency)
      .then((data) => {
        setAddress(data.address);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('error', 'Failed to generate deposit address');
        setLoading(false);
      });
  }, [wallet]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-2 dark:text-white">Deposit {wallet.currency}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Direct stablecoin transfers credit the USDC treasury vault.</p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            {unsupportedDeposit ? (
              <div className="text-sm text-gray-600 dark:text-gray-300 text-left space-y-2">
                <p>This wallet does not use a direct deposit address.</p>
                <p>Use the USDC vault for address-based deposits.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-2">Send only {wallet.currency} to this address</p>
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                ) : (
                  <div className="font-mono text-sm break-all select-all bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    {address}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
            <button
              onClick={() => address && void navigator.clipboard.writeText(address)}
              disabled={!address || unsupportedDeposit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Copy Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConvertModal = ({ wallets, onClose, onSuccess }: { wallets: WalletData[]; onClose: () => void; onSuccess: () => void }) => {
  const { showToast } = useToast();
  const normalizedWallets = Array.isArray(wallets) ? wallets : [];
  const treasuryWallet = normalizedWallets.find((wallet) => wallet.currency === 'USDC') || normalizedWallets[0];
  const [fromCurr, setFromCurr] = useState(normalizedWallets[0]?.currency || 'USD');
  const [toCurr, setToCurr] = useState(treasuryWallet?.currency || 'USDC');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast('error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await treasuryApi.convertAssets({
        from_currency: fromCurr,
        to_currency: toCurr,
        amount: parseFloat(amount),
      });
      showToast('success', `Successfully converted ${amount} ${fromCurr} to ${toCurr}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      showToast('error', e.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-2 dark:text-white">Convert into USDC</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Uses the live FX endpoint to move value into the treasury vault.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {normalizedWallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.currency}>{wallet.currency}</option>
                ))}
                {!normalizedWallets.some((wallet) => wallet.currency === 'KES') && <option value="KES">KES</option>}
                {!normalizedWallets.some((wallet) => wallet.currency === 'USD') && <option value="USD">USD</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
              <select
                value={toCurr}
                onChange={(e) => setToCurr(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium mt-4 disabled:opacity-50"
          >
            {loading ? 'Converting...' : 'Review & Convert'}
          </button>

          <button onClick={onClose} className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Treasury;
