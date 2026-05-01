import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Phone, ShieldCheck, Globe, FileText } from 'lucide-react';
import { GlobalBackground } from '../components/ui/GlobalBackground';

const hasValidGoogleClientId = false;

export default function Signup() {
    const navigate = useNavigate();
    const { register, platformPreference } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('KE');
    const [accountType, setAccountType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
    const [idType, setIdType] = useState('national_id');
    const [idNumber, setIdNumber] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [acceptKyc, setAcceptKyc] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If no platform preference, redirect to landing
    useEffect(() => {
        if (!platformPreference) {
            navigate('/');
        }
    }, [platformPreference, navigate]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!phone) {
            setError('Enter your phone number to continue');
            setLoading(false);
            return;
        }

        if (!country.trim() || !idType.trim() || !idNumber.trim()) {
            setError('Complete the identity details to create your account');
            setLoading(false);
            return;
        }
        if (!acceptTerms || !acceptPrivacy || !acceptKyc) {
            setError('Accept the terms, privacy policy, and KYC consent to continue');
            setLoading(false);
            return;
        }

        try {
            await register({
                email,
                password,
                name,
                phone,
                country,
                accountType,
                idType,
                idNumber,
                acceptTerms,
                acceptPrivacy,
                acceptKyc,
            });

            if (platformPreference === 'whatsapp') {
                // Redirect to WhatsApp with pre-filled message for KYC
                const whatsappNumber = '254798559893'; // Corridor WhatsApp number
                const message = encodeURIComponent(
                    `Hi Corridor! I just signed up with email: ${email}. I'd like to complete my KYC and start using Corridor on WhatsApp.`
                );
                window.location.href = `https://wa.me/${whatsappNumber}?text=${message}`;
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Could not create your account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <GlobalBackground />

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center mb-6 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100">
                        <img src="/corridor-logo.svg" alt="Corridor" className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                        {platformPreference === 'whatsapp' ? 'Sign up for WhatsApp' : 'Create your account'}
                    </h2>
                    <p className="text-slate-600">
                        {platformPreference === 'whatsapp'
                            ? 'Start using Corridor on WhatsApp'
                            : 'Set up your account in a minute'}
                    </p>
                </div>

{/* Signup Form */}
        <div className="bg-white/60 rounded-3xl border border-white/80 p-8 backdrop-blur-xl shadow-2xl shadow-slate-200/50">
          <div className="mb-6">
            <div className={`relative ${hasValidGoogleClientId ? 'mt-6' : ''}`}>
              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white/0 text-slate-400 font-medium">
                                    {hasValidGoogleClientId ? 'Or use your email' : 'Use your email'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSignup}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

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
                            <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                Phone number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                                    placeholder="+254 700 000 000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 ml-1 font-medium">
                                We use this for account verification and security alerts.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-slate-700" />
                                <h3 className="text-sm font-bold text-slate-900">Identity details</h3>
                            </div>
                            <div className="grid gap-4">
                                <div>
                                    <label htmlFor="country" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                        Country
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            id="country"
                                            name="country"
                                            type="text"
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            placeholder="KE"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="accountType" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                            Account type
                                        </label>
                                        <select
                                            id="accountType"
                                            value={accountType}
                                            onChange={(e) => setAccountType(e.target.value as 'PERSONAL' | 'BUSINESS')}
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        >
                                            <option value="PERSONAL">Personal</option>
                                            <option value="BUSINESS">Business</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="idType" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                            ID type
                                        </label>
                                        <select
                                            id="idType"
                                            value={idType}
                                            onChange={(e) => setIdType(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        >
                                            <option value="national_id">National ID</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="idNumber" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                        ID number
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            id="idNumber"
                                            name="idNumber"
                                            type="text"
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            placeholder="Enter your ID number"
                                            value={idNumber}
                                            onChange={(e) => setIdNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    We collect this at registration so your account can be verified without sending you elsewhere later.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3">
                            <div className="flex items-start gap-3">
                                <input
                                    id="acceptTerms"
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="acceptTerms" className="text-sm text-slate-700 leading-6">
                                    I agree to the <a href="/legal" className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950">Terms of Service</a>.
                                </label>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    id="acceptPrivacy"
                                    type="checkbox"
                                    checked={acceptPrivacy}
                                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="acceptPrivacy" className="text-sm text-slate-700 leading-6">
                                    I have read and agree to the <a href="/privacy" className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950">Privacy Policy</a>.
                                </label>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    id="acceptKyc"
                                    type="checkbox"
                                    checked={acceptKyc}
                                    onChange={(e) => setAcceptKyc(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="acceptKyc" className="text-sm text-slate-700 leading-6">
                                    I consent to KYC verification and compliance checks.
                                </label>
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
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
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

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-fade-in">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-600">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full px-4 py-4 ${platformPreference === 'whatsapp'
                                        ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300'
                                        } text-white font-bold rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                            Creating your account...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            {platformPreference === 'whatsapp' ? 'Open WhatsApp' : 'Create account'}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors"
                                >
                                    Change sign-up option
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        Already signed up?{' '}
                        <a href="/login" className="text-blue-600 font-bold hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
