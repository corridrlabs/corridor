import React, { useState, useEffect } from 'react';
import { 
    User, 
    Building2, 
    Save, 
    CheckCircle, 
    AlertCircle, 
    Settings as SettingsIcon, 
    Copy, 
    Check, 
    Trash2, 
    ShieldCheck, 
    SlidersHorizontal, 
    Compass, 
    Users, 
    Zap, 
    Globe, 
    CreditCard, 
    Lock, 
    Bell, 
    Key, 
    ChevronRight,
    ArrowUpRight,
    Loader2,
    ShieldAlert,
    Fingerprint,
    Smartphone,
    Mail,
    Terminal,
    History,
    FileText,
    Download,
    Info,
    X
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { AccountSettings } from './AccountSettings';
import { userService, businessService } from '../services/userService';
import { submitKYC, listKYC, downloadKYCDocument } from '../api/kyc';
import { accountApi } from '../api/account';
import { authApi } from '../api/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDashboardPreferences } from '../hooks/useDashboardPreferences';

// ─── Sub-components ─────────────────────────────────────────────────────────

const SettingsSection: React.FC<{ title: string; description: string; icon: React.FC<any>; children: React.ReactNode }> = ({
    title, description, icon: Icon, children
}) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-50 text-indigo-600">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>
        </div>
        <div className="p-8">
            {children}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; subLabel?: string; value: string; onChange?: (e: any) => void; disabled?: boolean; placeholder?: string; type?: string }> = ({
    label, subLabel, value, onChange, disabled, placeholder, type = "text"
}) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end">
            <label className="block text-xs font-semibold text-slate-500">{label}</label>
            {subLabel && <span className="text-[10px] text-slate-400 italic">{subLabel}</span>}
        </div>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all disabled:opacity-50"
        />
    </div>
);

const ToggleButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.FC<any> }> = ({
    active, onClick, label, icon: Icon
}) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
            active 
            ? 'bg-indigo-600 border-indigo-700 shadow-sm' 
            : 'bg-white border-slate-100 hover:border-slate-200'
        }`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'
            }`}>
                <Icon size={16} />
            </div>
            <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                {label}
            </span>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'bg-white/30' : 'bg-slate-100'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </button>
);

export const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useUser();
    const { user: authUser } = useAuthStore();
    const dashboardUserId = (authUser as any)?.id;
    const { preferences, updatePreference, resetPreferences } = useDashboardPreferences(dashboardUserId);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [projectApiKey, setProjectApiKey] = useState('No API key yet. Create one in Developer Hub.');
    const [projectData, setProjectData] = useState({
        id: '',
        name: '',
        description: '',
        region: '',
    });
    const [projectLoading, setProjectLoading] = useState(false);
    const [projectSaving, setProjectSaving] = useState(false);
    const [projectMessage, setProjectMessage] = useState('');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    const [businessData, setBusinessData] = useState({
        name: '',
        industry: '',
        website: '',
        description: '',
    });

    const [kycFiles, setKycFiles] = useState({
        id_document: null as File | null,
        registration_document: null as File | null,
        proof_of_address_document: null as File | null,
    });
    const [kycRecords, setKycRecords] = useState<any[]>([]);
    const [kycMessage, setKycMessage] = useState<string>('');

    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get('tab');
        if (tabParam && ['profile', 'account', 'project', 'kyc', 'team', 'payroll', 'preferences'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [location.search]);

    useEffect(() => {
        if (authUser) {
            setProfileData({
                full_name: (authUser as any).full_name || authUser.name || '',
                email: authUser.email || '',
                phone_number: (authUser as any).whatsapp_phone || (authUser as any).phone || '',
            });
            fetchBusinessProfile();
        }
    }, [authUser]);

    useEffect(() => {
        const refreshProfile = async () => {
            try {
                const latest = await authApi.getCurrentUser();
                setProfileData({
                    full_name: (latest as any).full_name || latest.name || '',
                    email: latest.email || '',
                    phone_number: (latest as any).whatsapp_phone || (latest as any).phone || '',
                });
            } catch (error) {
                console.error('Failed to load current user profile:', error);
            }
        };

        if (!authUser) {
            refreshProfile();
        }
    }, [authUser]);

    useEffect(() => {
        const loadProjectAPIKey = async () => {
            try {
                const keys = await accountApi.getApiKeys();
                if (Array.isArray(keys) && keys.length > 0) {
                    const activeKey = keys.find((k: any) => k?.is_active) || keys[0];
                    const prefix = activeKey?.prefix ? `${activeKey.prefix}••••••••` : '';
                    setProjectApiKey(prefix || 'API key available in Developer Hub');
                }
            } catch (_err) {
                setProjectApiKey('Unable to load API key. Open Developer Hub to manage keys.');
            }
        };
        loadProjectAPIKey();
    }, []);

    const loadProject = async () => {
        setProjectLoading(true);
        setProjectMessage('');
        try {
            const projects = await accountApi.getProjects();
            const first = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;
            if (first) {
                setProjectData({
                    id: first.id,
                    name: first.name || '',
                    description: first.description || '',
                    region: first.region || '',
                });
            } else {
                setProjectData({
                    id: '',
                    name: '',
                    description: '',
                    region: '',
                });
            }
        } catch (_err) {
            setProjectMessage('Unable to load project information right now.');
        } finally {
            setProjectLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'project') {
            loadProject();
        }
    }, [activeTab]);

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setProjectMessage('');

        if (projectData.id) {
            setProjectMessage('Project updates are managed in the Projects page.');
            return;
        }

        if (!projectData.name.trim()) {
            setProjectMessage('Enter a project name to continue.');
            return;
        }

        setProjectSaving(true);
        try {
            await accountApi.createProject({
                name: projectData.name,
                description: projectData.description || undefined,
                region: projectData.region || undefined,
            });
            setProjectMessage('Project created successfully.');
            await loadProject();
        } catch (err: any) {
            setProjectMessage(err?.response?.data?.error || err?.response?.data?.detail || 'Unable to save project right now.');
        } finally {
            setProjectSaving(false);
        }
    };

    const fetchBusinessProfile = async () => {
        try {
            const profile = await businessService.getProfile();
            setBusinessData({
                name: profile.name || '',
                industry: profile.industry || '',
                website: profile.website || '',
                description: profile.description || '',
            });
        } catch (err) {
            console.error("Failed to fetch business profile", err);
            setBusinessData({
                name: '',
                industry: '',
                website: '',
                description: '',
            });
        }
    }

    const loadKyc = async () => {
        try {
            const records = await listKYC();
            setKycRecords(Array.isArray(records) ? records : []);
        } catch (err) {
            console.error('Failed to load KYC submissions', err);
            setKycRecords([]);
        }
    };

    useEffect(() => {
        if (activeTab === 'kyc') {
            loadKyc();
        }
    }, [activeTab]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await userService.updateProfile({
                full_name: profileData.full_name,
                phone_number: profileData.phone_number,
            });
            await businessService.updateProfile(businessData);
            await useAuthStore.getState().refreshUser();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitKYC = async (e: React.FormEvent) => {
        e.preventDefault();
        setKycMessage('');
        const formData = new FormData();
        if (kycFiles.id_document) formData.append('id_document', kycFiles.id_document);
        if (kycFiles.registration_document) formData.append('registration_document', kycFiles.registration_document);
        if (kycFiles.proof_of_address_document) formData.append('proof_of_address_document', kycFiles.proof_of_address_document);

        if (!kycFiles.id_document && !kycFiles.registration_document && !kycFiles.proof_of_address_document) {
            setKycMessage('Upload at least one PDF document');
            return;
        }
        try {
            await submitKYC(formData);
            setKycMessage('Submitted for review');
            setKycFiles({
                id_document: null,
                registration_document: null,
                proof_of_address_document: null,
            });
            await loadKyc();
        } catch (err: any) {
            setKycMessage(err?.response?.data?.detail || 'Submission failed');
        }
    };

    const handleKycFileChange = (field: keyof typeof kycFiles, file: File | null) => {
        setKycFiles((prev) => ({
            ...prev,
            [field]: file,
        }));
    };

    const downloadKycDoc = async (documentId: string, fileName?: string) => {
        try {
            const blob = await downloadKYCDocument(documentId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'kyc-document.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download KYC document', err);
            setKycMessage('Failed to download document');
        }
    };

    const navItems = [
        { id: 'profile', label: 'User Profile', icon: User, desc: 'Personal details & contact info' },
        { id: 'account', label: 'Business Profile', icon: Building2, desc: 'Company settings & details' },
        { id: 'project', label: 'Project Settings', icon: Terminal, desc: 'API keys & project info' },
        { id: 'team', label: 'Team Management', icon: Users, desc: 'Manage your team members' },
        { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck, desc: 'Trust & transaction limits' },
        { id: 'workspace', label: 'UI Preferences', icon: SlidersHorizontal, desc: 'Personalize your dashboard' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 pt-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your account, business profile, and platform preferences.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-24">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    activeTab === item.id
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                <item.icon size={18} />
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{item.label}</p>
                                </div>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <button 
                            onClick={async () => {
                                await useAuthStore.getState().logout();
                                navigate('/login');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all"
                        >
                            Log Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 space-y-8 w-full">
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <SettingsSection title="User Profile" description="Update your personal identity and contact information." icon={User}>
                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Full Name" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} />
                                        <InputField label="Email Address" value={profileData.email} disabled subLabel="Verified" />
                                        <InputField label="Phone Number" value={profileData.phone_number} onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })} placeholder="+..." />
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 space-y-6">
                                        <h4 className="text-xs font-bold text-slate-400">Business Information</h4>

                                        <div className="space-y-4">
                                            <label className="block text-xs font-semibold text-slate-500">Industry</label>
                                            <select
                                                value={businessData.industry}
                                                onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">Select Industry...</option>
                                                <option value="technology">Technology</option>
                                                <option value="retail">Retail</option>
                                                <option value="finance">Finance</option>
                                                <option value="healthcare">Healthcare</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <InputField label="Website" value={businessData.website} onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })} placeholder="https://" />
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-500">Description</label>
                                            <textarea
                                                value={businessData.description}
                                                onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                                                rows={4}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                                placeholder="Tell us about your business..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="text-sm font-medium">
                                            {success && <span className="text-emerald-500 flex items-center gap-2"><CheckCircle size={16} /> Settings Saved</span>}
                                            {error && <span className="text-rose-500 flex items-center gap-2"><ShieldAlert size={16} /> {error}</span>}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </SettingsSection>

                            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">Security</h3>
                                        <p className="text-slate-400 text-sm">Protect your account with multi-factor authentication and security keys.</p>
                                    </div>
                                    <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                                        Manage Security
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'project' && (
                        <div className="space-y-8">
                            <SettingsSection title="Project Settings" description="Manage your project configuration and API access." icon={Terminal}>
                                {projectLoading ? (
                                    <div className="py-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-sm text-slate-400">Loading project info...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveProject} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <InputField label="Project Name" value={projectData.name} onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))} placeholder="Main Project" />
                                             <InputField label="Region" value={projectData.region || 'Global'} disabled subLabel="Managed" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-500">Description</label>
                                            <textarea
                                                value={projectData.description}
                                                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                                placeholder="Project description..."
                                            />
                                        </div>
                                         {projectMessage && (
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                                <Info size={16} className="text-indigo-500" />
                                                <p className="text-sm text-slate-600">{projectMessage}</p>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
                                             {projectData.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/projects')}
                                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                                                >
                                                    View Projects
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={projectSaving}
                                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {projectSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                {projectData.id ? 'Save Changes' : 'Create Project'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </SettingsSection>

                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">API Key</h3>
                                        <p className="text-sm text-slate-400">Your primary access key for the Corridor API.</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                        <Key size={20} />
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-mono text-sm font-semibold text-slate-700 break-all">
                                        {projectApiKey}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(projectApiKey)}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate('/developers')}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                                >
                                    Go to Developer Hub <ArrowUpRight size={14} />
                                </button>
                            </div>

                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500 border border-rose-50">
                                        <Trash2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-rose-900">Delete Project</h4>
                                        <p className="text-sm text-rose-600/70">Permanently remove this project and all its data.</p>
                                    </div>
                                </div>
                                <button className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-sm">
                                    Delete Project
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'kyc' && (
                        <div className="space-y-8">
                             <SettingsSection title="KYC Verification" description="Verify your identity to unlock higher transaction limits." icon={ShieldCheck}>
                                {kycMessage && (
                                    <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                                        <Info size={18} className="text-indigo-500" />
                                        <p className="font-semibold text-indigo-900 text-sm">{kycMessage}</p>
                                    </div>
                                )}
                                <form onSubmit={handleSubmitKYC} className="space-y-8">
                                     <div className="grid gap-6 md:grid-cols-3">
                                        {[
                                            { id: 'id_document', label: 'Government ID', desc: 'Passport or ID card', icon: Fingerprint },
                                            { id: 'registration_document', label: 'Business License', desc: 'Registration certificate', icon: Building2 },
                                            { id: 'proof_of_address_document', label: 'Proof of Address', desc: 'Utility bill or bank statement', icon: Globe }
                                        ].map((doc) => (
                                            <div key={doc.id} className="relative group">
                                                <div className={`p-6 bg-slate-50 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center text-center cursor-pointer hover:bg-white hover:border-indigo-200 ${(kycFiles as any)[doc.id] ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'}`}>
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all shadow-sm ${ (kycFiles as any)[doc.id] ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:text-indigo-500'}`}>
                                                        <doc.icon size={20} />
                                                    </div>
                                                    <span className="block text-sm font-bold text-slate-900 mb-1">{doc.label}</span>
                                                    <p className="text-xs text-slate-400">{doc.desc}</p>
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={(e) => handleKycFileChange(doc.id as any, e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                     </div>

                                     <div className="flex flex-wrap gap-3">
                                        {Object.entries(kycFiles).map(([key, file]) => file && (
                                             <div key={key} className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-3 shadow-sm">
                                                <FileText size={12} className="text-indigo-500" />
                                                <span className="text-xs font-bold text-indigo-700 truncate max-w-[150px]">{file.name}</span>
                                                <button type="button" onClick={() => handleKycFileChange(key as any, null)} className="text-indigo-300 hover:text-indigo-600 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                     </div>

                                     <button
                                        type="submit"
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={20} />
                                        Submit for Review
                                    </button>
                                </form>
                             </SettingsSection>

                             <SettingsSection title="KYC History" description="View your previous verification submissions." icon={History}>
                                {(!kycRecords || kycRecords.length === 0) ? (
                                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                                        <History size={40} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm text-slate-400">No verification history found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {kycRecords.map((r) => (
                                            <div key={r.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                            {r.status}
                                                        </div>
                                                        <span className="text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {Array.isArray(r.documents) && r.documents.map((doc: any, idx: number) => (
                                                            <div key={doc.id || idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                                <div className="flex items-center gap-3">
                                                                    <FileText size={16} className="text-slate-300" />
                                                                    <span className="text-xs font-semibold text-slate-600">{doc.document_type || 'Document'}: {doc.file_name || 'Attached file'}</span>
                                                                </div>
                                                                {doc.id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => downloadKycDoc(doc.id, doc.file_name)}
                                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                                    >
                                                                        <Download size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                       ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="space-y-8">
                             <SettingsSection title="Team Management" description="Manage your team members and their access levels." icon={Users}>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                                    <div className="relative z-10 space-y-4 max-w-xl">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 text-indigo-400">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold">Team Access</h3>
                                        <p className="text-slate-400 text-sm">Manage roles and permissions for developers, financiers, and admins.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/team')}
                                        className="relative z-10 px-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                                    >
                                        Manage Team
                                    </button>
                                </div>
                             </SettingsSection>

                             <SettingsSection title="Payroll & EWA" description="Manage payroll and Earned Wage Access settings." icon={Zap}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => navigate('/employee-ewa')}
                                        className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-left group hover:shadow-md transition-all"
                                    >
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 border border-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Smartphone size={24} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">EWA Settings</h4>
                                        <p className="text-xs text-slate-400">Configure employee eligibility for Earned Wage Access.</p>
                                    </button>
                                    <button
                                        onClick={() => navigate('/payroll')}
                                        className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-left group hover:shadow-md transition-all"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Zap size={24} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">Payroll</h4>
                                        <p className="text-xs text-slate-400">Execute mass payouts and manage salary disbursements.</p>
                                    </button>
                                </div>
                             </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div className="space-y-8">
                             <SettingsSection title="UI Preferences" description="Personalize your dashboard experience and layout." icon={SlidersHorizontal}>
                                <div className="flex justify-between items-center mb-8">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900">Dashboard Layout</h4>
                                        <p className="text-xs text-slate-400">Customize how your dashboard looks and feels.</p>
                                    </div>
                                    <button
                                        onClick={resetPreferences}
                                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        Reset to Defaults
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleButton active={preferences.layout === 'comfortable'} onClick={() => updatePreference('layout', 'comfortable')} label="Comfortable" icon={Zap} />
                                    <ToggleButton active={preferences.layout === 'compact'} onClick={() => updatePreference('layout', 'compact')} label="Compact" icon={SlidersHorizontal} />
                                    <ToggleButton active={preferences.showStats} onClick={() => updatePreference('showStats', !preferences.showStats)} label="Show Stats" icon={ShieldCheck} />
                                    <ToggleButton active={preferences.showActivity} onClick={() => updatePreference('showActivity', !preferences.showActivity)} label="Show Activity" icon={History} />
                                    <ToggleButton active={preferences.showFinanceHub} onClick={() => updatePreference('showFinanceHub', !preferences.showFinanceHub)} label="Show Finance" icon={CreditCard} />
                                    <ToggleButton active={preferences.showPeopleHub} onClick={() => updatePreference('showPeopleHub', !preferences.showPeopleHub)} label="Show Team" icon={Users} />
                                    <ToggleButton active={preferences.showAutomationHub} onClick={() => updatePreference('showAutomationHub', !preferences.showAutomationHub)} label="Show Automations" icon={Zap} />
                                    <ToggleButton active={preferences.showSidebar} onClick={() => updatePreference('showSidebar', !preferences.showSidebar)} label="Show Sidebar" icon={Compass} />
                                </div>
                             </SettingsSection>

                             <div className="bg-indigo-600 rounded-3xl p-12 text-white text-center shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                                        <Compass size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">Platform Walkthrough</h3>
                                    <p className="text-indigo-100 text-sm mb-8 max-w-md">Restart the product tour to rediscover features and tools.</p>
                                    <button
                                         onClick={() => {
                                            localStorage.setItem('corridor-force-tour', '1');
                                            navigate('/dashboard');
                                        }}
                                        className="px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                    >
                                        <Zap size={18} />
                                        Restart Tour
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'account' && <AccountSettings />}
                </main>
            </div>
        </div>
    );
};
