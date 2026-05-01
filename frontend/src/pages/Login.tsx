import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { GlobalBackground } from '../components/ui/GlobalBackground';

const getLoginErrorMessage = (err: any): string => {
  const detail = err?.response?.data?.detail;
  const error = err?.response?.data?.error;

  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof error === 'string' && error.trim()) return error;

  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
    return detail[0].msg;
  }

  const status = err?.response?.status;
  if (status === 401) return 'Incorrect email or password. Please try again.';
  if (status === 403) return 'Your account is not authorized to sign in here.';
  if (status === 404) return 'Account not found. Check your email or create an account.';
  if (status === 429) return 'Too many login attempts. Please wait a minute and try again.';
  if (status >= 500) return 'We could not sign you in right now. Please try again shortly.';

  if (err?.isNetworkError || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Unable to reach the server. Check your internet connection and try again.';
  }

  return 'Could not sign you in. Please check your details and try again.';
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <GlobalBackground />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-6 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100">
            <img src="/corridor-logo.svg" alt="Corridor" className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-600">Sign in to continue</p>
        </div>

        <div className="bg-white/60 rounded-3xl border border-white/80 p-8 backdrop-blur-xl shadow-2xl shadow-slate-200/50">
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/0 text-slate-400 font-medium">Use your email to sign in</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 font-medium">
            New here?{' '}
            <a href="/onboarding" className="text-blue-600 font-bold hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
