import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Wallet, ShieldCheck } from 'lucide-react';
import { GlobalBackground } from '../components/ui/GlobalBackground';
import { useAuthStore } from '../store/authStore';
import { treasuryApi } from '../api/treasury';
import { needsWalletSetup } from '../utils/walletSetup';

export default function WalletSetup() {
  const navigate = useNavigate();
  const { user, refreshUser, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (user && !needsWalletSetup(user)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await treasuryApi.createManagedWallet();
      const address = result?.wallet?.public_key || '';
      setWalletAddress(address);
      await refreshUser().catch(() => null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Could not create your Corridor wallet right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (needsWalletSetup(user) && !walletAddress) {
      setError('Create your wallet before continuing.');
      return;
    }

    await refreshUser().catch(() => null);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <GlobalBackground />

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/80 p-10 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Set up your wallet</h1>
              <p className="text-slate-600">Finish this after sign in so your workspace can handle payments.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Managed wallet
              </div>
              <p className="text-sm text-slate-600">
                Corridor creates a wallet for your account and keeps it linked to your profile.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                Ready for dashboard
              </div>
              <p className="text-sm text-slate-600">
                Once the wallet is created, you can continue straight into your dashboard.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Create Corridor wallet</h2>
            <p className="text-sm text-slate-600 mb-5">
              This is the post-login wallet setup step. It is separate from onboarding so the onboarding flow stays focused on account setup.
            </p>

            <button
              type="button"
              onClick={handleCreateWallet}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Creating wallet...' : 'Create managed wallet'}
            </button>

            {walletAddress && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900 mb-1">Wallet created</p>
                <p className="text-xs text-emerald-800 break-all font-mono">{walletAddress}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Continue to dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
