import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Check, Building2, Zap, Sparkles, Rocket, ArrowRight, User, Lock, Phone, FileText, Mail, Eye, EyeOff, Workflow, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onboardingService, OnboardingAIRecommendation } from '../../services/onboarding';
import { accountApi } from '../../api/account';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { PhoneInput } from '../ui/PhoneInput';
import { SettingsAccordion, AccordionItem } from '../ui/Accordion';
import { GlobalBackground } from '../ui/GlobalBackground';

interface OnboardingData {
    // Registration Data
    email?: string;
    password?: string;
    phone?: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    username: string;
    accountType: 'PERSONAL' | 'BUSINESS';
    country: string;
    timezone: string;
    defaultCurrency: string;
    notificationEmail: string;

    // Business Data
    businessName: string;
    industry: string;
    employeeCount: number;
    companyStage: 'solo' | 'startup' | 'growth' | 'enterprise';
    primaryGoal: string;
    primaryUseCase: 'full_platform' | 'social_only' | 'ewa_only' | 'api_partner';
    website: string;

    // KYC Data
    idType: string;
    idNumber: string;

    features: string[];
    apps: string[];
    workflows: string[];
}

type OnboardingPath = 'guided' | 'ai' | 'quick';

type StepNumber = 0 | 1 | 2 | 3 | 4;

type OnboardingDraft = {
    step?: StepNumber;
    onboardingPath?: OnboardingPath | null;
    selectedPlan?: string | null;
    verificationCode?: string;
    verificationChannel?: 'email' | 'whatsapp' | null;
    acceptTerms?: boolean;
    acceptPrivacy?: boolean;
    acceptKyc?: boolean;
    data?: Partial<OnboardingData>;
};

const ONBOARDING_DRAFT_KEY = 'corridor-onboarding-draft';

const loadOnboardingDraft = (): OnboardingDraft => {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as OnboardingDraft;
    } catch {
        return {};
    }
};

const clearOnboardingDraft = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
};

const FEATURE_LIBRARY = [
    { id: 'ewa', name: 'Earned Wage Access', desc: 'On-demand pay for employees' },
    { id: 'social_payments', name: 'Social Payments', desc: 'P2P and social goal-based funding' },
    { id: 'treasury', name: 'Treasury & Assets', desc: 'Manage multi-currency wallets and swaps' },
    { id: 'invoicing', name: 'Invoicing & B2B', desc: 'Create and send professional invoices' },
    { id: 'analytics', name: 'Advanced Analytics', desc: 'Deep insights into your financial data' },
    { id: 'api_access', name: 'Developer API', desc: 'Build on top of the Corridor stack' }
];

const WORKFLOW_LIBRARY = [
    { id: 'auto_reconcile', name: 'Auto-Reconciliation', desc: 'Automatically match settlements to invoices' },
    { id: 'smart_sweep', name: 'Revenue Sweep', desc: 'Sweep excess funds to yield-bearing vaults' },
    { id: 'kyc_auto', name: 'Automated KYC', desc: 'AI-assisted verify for teammates/customers' },
    { id: 'scheduled_payouts', name: 'Scheduled Payouts', desc: 'Run payroll and vendor payments on schedule' },
    { id: 'social_goal_automation', name: 'Social Goal Automation', desc: 'Auto-create goals and reminders for campaigns' }
];

const APP_LIBRARY = [
    { id: 'dashboard', name: 'Command Center', desc: 'Workspace, alerts, and summary widgets' },
    { id: 'payments', name: 'Payments Hub', desc: 'Borderless pay, funding, and transfers' },
    { id: 'social', name: 'Social Hub', desc: 'Goals, split bills, and feeds' },
    { id: 'developers', name: 'Developer Hub', desc: 'API keys, webhooks, sandbox, and docs' },
    { id: 'people', name: 'People Hub', desc: 'Team, payroll, and EWA' }
];

const deriveRecommendedFeatures = (path: OnboardingPath, data: OnboardingData) => {
    const base = new Set<string>();

    if (path === 'quick') {
        base.add('invoicing');
        base.add(data.primaryUseCase === 'ewa_only' ? 'ewa' : 'social_payments');
        if (data.primaryUseCase === 'api_partner') base.add('api_access');
        return Array.from(base);
    }

    if (path === 'guided') {
        base.add('invoicing');
        if (data.primaryUseCase === 'social_only' || data.primaryUseCase === 'full_platform') base.add('social_payments');
        if (data.primaryUseCase === 'ewa_only' || data.primaryUseCase === 'full_platform') base.add('ewa');
        if (data.companyStage === 'growth' || data.companyStage === 'enterprise') base.add('treasury');
        if (data.primaryUseCase === 'api_partner') base.add('api_access');
        return Array.from(base);
    }

    if (path === 'ai') {
        base.add('invoicing');
        if (data.primaryUseCase === 'ewa_only') base.add('ewa');
        if (data.primaryUseCase === 'social_only' || data.primaryGoal.toLowerCase().includes('group') || data.primaryGoal.toLowerCase().includes('community')) {
            base.add('social_payments');
        }
        if (data.employeeCount >= 10 || data.companyStage === 'growth' || data.companyStage === 'enterprise') {
            base.add('treasury');
        }
        if (data.primaryGoal.toLowerCase().includes('api') || data.primaryUseCase === 'api_partner') {
            base.add('api_access');
        }
        if (data.employeeCount >= 25 || data.companyStage === 'enterprise') {
            base.add('analytics');
        }
        return Array.from(base);
    }

    return data.features;
};

const deriveRecommendedWorkflows = (path: OnboardingPath, data: OnboardingData) => {
    const workflows: string[] = [];

    if (path === 'quick') {
        workflows.push('scheduled_payouts');
        if (data.primaryUseCase === 'social_only') workflows.push('social_goal_automation');
        return workflows;
    }

    if (path === 'guided') {
        workflows.push('scheduled_payouts');
        workflows.push('auto_reconcile');
        if (data.primaryUseCase === 'social_only' || data.primaryUseCase === 'full_platform') workflows.push('social_goal_automation');
        if (data.primaryUseCase === 'ewa_only' || data.companyStage !== 'solo') workflows.push('kyc_auto');
        if (data.companyStage === 'growth' || data.companyStage === 'enterprise') workflows.push('smart_sweep');
        return workflows;
    }

    if (path === 'ai') {
        workflows.push('scheduled_payouts');
        workflows.push('auto_reconcile');
        if (data.companyStage !== 'solo') workflows.push('smart_sweep');
        if (data.primaryUseCase === 'social_only') workflows.push('social_goal_automation');
        if (data.primaryUseCase === 'ewa_only') workflows.push('kyc_auto');
        return workflows;
    }

    return data.workflows;
};

const deriveRecommendedApps = (path: OnboardingPath, data: OnboardingData) => {
    const apps: string[] = ['dashboard', 'payments'];
    if (data.primaryUseCase === 'social_only' || data.primaryUseCase === 'full_platform' || path === 'quick') apps.push('social');
    if (data.primaryUseCase === 'api_partner' || path !== 'quick') apps.push('developers');
    if (data.primaryUseCase === 'ewa_only' || data.companyStage !== 'solo') apps.push('people');
    return Array.from(new Set(apps));
};

const uniqueMerge = <T,>(...lists: T[][]) => {
    const merged: T[] = [];
    lists.forEach((list) => merged.push(...list));
    return Array.from(new Set(merged));
};

const OnboardingWizard: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isAuthenticated, login, register, user, refreshUser, setUser } = useAuthStore();
    const [searchParams] = useSearchParams();
    const storedDraft = useMemo(() => loadOnboardingDraft(), []);

    // Decode context from URL
    const contextParam = searchParams.get('context');
    let initialPlan = searchParams.get('plan'); // Fallback to plain param

    if (contextParam) {
        try {
            const decoded = JSON.parse(atob(contextParam));
            if (decoded.plan) {
                initialPlan = decoded.plan;
            }
        } catch (e) {
            console.error('Failed to decode onboarding context', e);
        }
    }

    // Step 0: Register, 1: Path, 2: Business, 3: Features, 4: Apps
    const [step, setStep] = useState<StepNumber>(storedDraft.step ?? 1);
    const [onboardingPath, setOnboardingPath] = useState<'guided' | 'ai' | 'quick' | null>(storedDraft.onboardingPath ?? null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [verificationCode, setVerificationCode] = useState(storedDraft.verificationCode ?? '');
    const [verificationChannel, setVerificationChannel] = useState<'email' | 'whatsapp' | null>(storedDraft.verificationChannel ?? null);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(storedDraft.selectedPlan ?? initialPlan);
    const [showPassword, setShowPassword] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<OnboardingAIRecommendation | null>(null);
    const [acceptTerms, setAcceptTerms] = useState(Boolean(storedDraft.acceptTerms));
    const [acceptPrivacy, setAcceptPrivacy] = useState(Boolean(storedDraft.acceptPrivacy));
    const [acceptKyc, setAcceptKyc] = useState(Boolean(storedDraft.acceptKyc));

    const [data, setData] = useState<OnboardingData>({
        email: '',
        password: '',
        phone: '',
        fullName: '',
        username: '',
        accountType: 'PERSONAL',
        country: 'KE',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi',
        defaultCurrency: 'KES',
        notificationEmail: '',
        businessName: '',
        industry: '',
        employeeCount: 0,
        companyStage: 'startup',
        primaryGoal: '',
        primaryUseCase: 'full_platform',
        website: '',
        idType: 'national_id',
        idNumber: '',
        features: [],
        apps: [],
        workflows: [],
        ...storedDraft.data
        });

    // If user is already authenticated, skip registration step (Step 0)
    useEffect(() => {
        // Authenticated users skip registration step entirely.
        if (isAuthenticated && step === 0) {
            setStep(1);
        }
    }, [isAuthenticated, step]);

    useEffect(() => {
        const saved = user?.onboarding_data as any;
        const accountSettings = user?.settings as any;
        if (!saved || typeof saved !== 'object') {
            if (!accountSettings || typeof accountSettings !== 'object') {
                return;
            }
        }

        if (saved && typeof saved === 'object') {
            setOnboardingPath((saved.path as 'guided' | 'ai' | 'quick' | null) || onboardingPath);
            setSelectedPlan((saved.selected_plan as string) || selectedPlan);
        }

        setData((prev) => ({
            ...prev,
            email: saved?.email || prev.email,
            phone: saved?.business_info?.kyc?.phone || saved?.wallet_setup?.phone || prev.phone,
            fullName: saved?.full_name || accountSettings?.full_name || prev.fullName,
            username: saved?.username || accountSettings?.username || prev.username,
            accountType: (saved?.account_type as OnboardingData['accountType']) || accountSettings?.account_type || prev.accountType,
            country: saved?.country || accountSettings?.country || prev.country,
            timezone: saved?.timezone || accountSettings?.timezone || prev.timezone,
            defaultCurrency: saved?.default_currency || accountSettings?.default_currency || prev.defaultCurrency,
            notificationEmail: saved?.notification_email || accountSettings?.notification_email || prev.notificationEmail,
            firstName: saved?.business_info?.firstName || prev.firstName,
            lastName: saved?.business_info?.lastName || prev.lastName,
            businessName: saved?.business_info?.name || accountSettings?.company_name || prev.businessName,
            industry: saved?.business_info?.industry || prev.industry,
            employeeCount: Number(saved?.business_info?.size) || prev.employeeCount,
            companyStage: (saved?.business_info?.company_stage as OnboardingData['companyStage']) || prev.companyStage,
            primaryGoal: saved?.business_info?.primary_goal || prev.primaryGoal,
            primaryUseCase: (saved?.business_info?.primary_use_case as OnboardingData['primaryUseCase']) || prev.primaryUseCase,
            website: saved?.business_info?.website || prev.website,
            idType: saved?.business_info?.kyc?.id_type || prev.idType,
            idNumber: saved?.business_info?.kyc?.id_number || prev.idNumber,
            features: Array.isArray(saved?.selected_features) ? saved.selected_features : prev.features,
            apps: Array.isArray(saved?.selected_apps) ? saved.selected_apps : prev.apps,
            workflows: Array.isArray(saved?.workflows) ? saved.workflows : prev.workflows,
        }));
    }, [user]);

    useEffect(() => {
        if (user?.onboarding_completed === true) {
            clearOnboardingDraft();
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const onboardingMode: OnboardingPath = onboardingPath || 'guided';
    const isQuickStart = onboardingMode === 'quick';
    const isAIOrchestration = onboardingMode === 'ai';
    const recommendedFeatures = useMemo(() => deriveRecommendedFeatures(onboardingMode, data), [onboardingMode, data]);
    const recommendedWorkflows = useMemo(() => deriveRecommendedWorkflows(onboardingMode, data), [onboardingMode, data]);
    const recommendedApps = useMemo(() => deriveRecommendedApps(onboardingMode, data), [onboardingMode, data]);
    const aiFeatureRecommendations = aiRecommendations?.features || recommendedFeatures;
    const aiWorkflowRecommendations = aiRecommendations?.workflows || recommendedWorkflows;
    const aiAppRecommendations = aiRecommendations?.apps || recommendedApps;
    const stepSequence = useMemo<StepNumber[]>(
        () => {
            if (isAuthenticated) {
                if (isQuickStart) return [1];
                if (isAIOrchestration) return [1, 2, 3, 4];
                return [1, 2, 3, 4];
            }

            // Unauthenticated flow: onboarding first, registration last.
            if (isQuickStart) return [1, 0];
            if (isAIOrchestration) return [1, 2, 3, 4, 0];
            return [1, 2, 3, 4, 0];
        },
        [isAuthenticated, isQuickStart, isAIOrchestration]
    );
    const visibleSteps = stepSequence;
    const visibleStepIndex = visibleSteps.indexOf(step);
    const visibleStepCount = visibleSteps.length;
    const isLastVisibleStep = visibleStepIndex === visibleStepCount - 1;

    useEffect(() => {
        if (visibleSteps.length === 0) return;
        if (visibleSteps.includes(step)) return;

        const nonTerminalSteps = visibleSteps.filter((item) => item !== 0);
        const fallbackStep = nonTerminalSteps.length > 0 ? nonTerminalSteps[nonTerminalSteps.length - 1] : visibleSteps[0];
        setStep(fallbackStep);
    }, [step, visibleSteps]);

    useEffect(() => {
        const draft: OnboardingDraft = {
            step,
            onboardingPath,
            selectedPlan,
            verificationCode,
            verificationChannel,
            acceptTerms,
            acceptPrivacy,
            acceptKyc,
            data,
        };

        window.sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    }, [step, onboardingPath, selectedPlan, verificationCode, verificationChannel, acceptTerms, acceptPrivacy, acceptKyc, data]);

    const seedPathDefaults = () => {
        setData((prev) => ({
            ...prev,
            features: uniqueMerge(prev.features, recommendedFeatures),
            apps: uniqueMerge(prev.apps, recommendedApps),
            workflows: uniqueMerge(prev.workflows, recommendedWorkflows),
        }));
    };

    const completeOnboarding = async (overridePath?: OnboardingPath) => {
        setIsSaving(true);
        try {
            const currentUser = useAuthStore.getState().user;
            const activePath = overridePath || onboardingMode;
            const isQuickFlow = activePath === 'quick';
            const isAIFlow = activePath === 'ai';
            const shouldAutoFill = isQuickFlow || isAIFlow;
            const finalFeatures = shouldAutoFill && !data.features.length
                ? (isAIFlow ? aiFeatureRecommendations : recommendedFeatures)
                : data.features;
            const finalWorkflows = shouldAutoFill && !data.workflows.length
                ? (isAIFlow ? aiWorkflowRecommendations : recommendedWorkflows)
                : data.workflows;
            const finalApps = shouldAutoFill && !data.apps.length
                ? (isAIFlow ? aiAppRecommendations : recommendedApps)
                : data.apps;

            const fallbackBusinessName = data.fullName.trim() || (data.email ?? '').split('@')[0] || 'User';
            const businessName = isQuickFlow ? fallbackBusinessName : data.businessName;
            const primaryUseCase = isQuickFlow ? 'full_platform' : data.primaryUseCase;
            const companyStage = isQuickFlow ? 'solo' : data.companyStage;
            const industry = isQuickFlow ? 'general' : data.industry;
            const employeeCount = isQuickFlow ? 1 : data.employeeCount;
            const website = isQuickFlow ? '' : data.website;
            const idType = isQuickFlow ? 'national_id' : data.idType;
            const idNumber = isQuickFlow ? '' : data.idNumber;

            await onboardingService.savePreferences({
                path: activePath,
                onboarding_mode: activePath,
                account_type: data.accountType,
                username: data.username || undefined,
                country: data.country,
                timezone: data.timezone,
                default_currency: data.defaultCurrency,
                notification_email: data.notificationEmail || data.email || '',
                business_info: {
                    name: businessName,
                    industry,
                    size: employeeCount.toString(),
                    company_stage: companyStage,
                    primary_goal: data.primaryGoal,
                    primary_use_case: primaryUseCase,
                    website,
                    kyc: {
                        id_type: idType,
                        id_number: idNumber,
                        phone: data.phone
                    }
                },
                selected_features: finalFeatures,
                selected_apps: finalApps,
                selected_workflows: finalWorkflows,
                selected_plan: selectedPlan || (isAIFlow ? 'business' : 'maker'),
                recommendations: {
                    mode: activePath,
                    features: shouldAutoFill ? finalFeatures : recommendedFeatures,
                    workflows: shouldAutoFill ? finalWorkflows : recommendedWorkflows,
                    apps: shouldAutoFill ? finalApps : recommendedApps,
                },
            });

            const updatedSettings = await accountApi.updateSettings({
                company_name: businessName,
                full_name: data.fullName.trim() || (data.email ?? '').split('@')[0],
                username: data.username || undefined,
                account_type: data.accountType,
                country: data.country,
                timezone: data.timezone,
                default_currency: data.defaultCurrency,
                notification_email: data.notificationEmail || data.email || '',
                phone_number: data.phone || undefined,
            }).catch(() => null);

            const refreshedUser = await refreshUser().catch(() => null);
            const baseUser = refreshedUser || currentUser || user;
            if (baseUser) {
                setUser({
                    ...baseUser,
                    onboarding_completed: true,
                    onboarding_data: {
                        ...(baseUser as any).onboarding_data,
                        onboarding_mode: activePath,
                        account_type: data.accountType,
                        country: data.country,
                        timezone: data.timezone,
                        default_currency: data.defaultCurrency,
                        notification_email: data.notificationEmail || data.email || '',
                        selected_features: finalFeatures,
                        selected_apps: finalApps,
                        selected_workflows: finalWorkflows,
                        business_info: {
                            name: businessName,
                            industry,
                            size: employeeCount.toString(),
                            company_stage: companyStage,
                            primary_goal: data.primaryGoal,
                            primary_use_case: primaryUseCase,
                            website,
                            kyc: {
                                id_type: idType,
                                id_number: idNumber,
                                phone: data.phone,
                            },
                        },
                    },
                    settings: {
                        ...(baseUser as any).settings,
                        company_name: updatedSettings?.company_name || businessName,
                        username: data.username || (baseUser as any).username,
                        account_type: data.accountType,
                        country: data.country,
                        timezone: data.timezone,
                        default_currency: data.defaultCurrency,
                        notification_email: data.notificationEmail || data.email || '',
                    },
                } as any);
            }

            showToast('success', 'Onboarding completed successfully!');
            clearOnboardingDraft();
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to save onboarding preferences:', error);
            showToast('error', 'Failed to save preferences. Redirecting anyway...');
            clearOnboardingDraft();
            navigate('/dashboard');
        } finally {
            setIsSaving(false);
        }
    };

    const advanceStep = () => {
        const currentIndex = stepSequence.indexOf(step);
        const nextStep = stepSequence[currentIndex + 1];
        if (typeof nextStep !== 'undefined') {
            setStep(nextStep);
        }
    };

    const retreatStep = () => {
        const currentIndex = stepSequence.indexOf(step);
        const previousStep = stepSequence[currentIndex - 1];
        if (typeof previousStep !== 'undefined') {
            setStep(previousStep);
        }
    };

    const handleNext = async () => {
        if (step === 0) {
            // Registration Validation
            if (!data.fullName.trim() || !data.email || !data.password) {
                showToast('error', 'Please provide full name, email, password, and identity details');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showToast('error', 'Please enter a valid email address');
                return;
            }
            if (!(data.phone || '').trim()) {
                showToast('error', 'Phone number is required for registration');
                return;
            }
            if (!data.country.trim()) {
                showToast('error', 'Country is required for registration');
                return;
            }
            if (!data.idType.trim() || !data.idNumber.trim()) {
                showToast('error', 'Identity document details are required for registration');
                return;
            }
            if (!acceptTerms || !acceptPrivacy || !acceptKyc) {
                showToast('error', 'Terms, privacy, and KYC consent are required for registration');
                return;
            }
            if (data.password.length < 8) {
                showToast('error', 'Password must be at least 8 characters');
                return;
            }

            try {
                setIsSaving(true);
                // Check if user exists
                const exists = await authApi.checkUserExists({ email: data.email, phone: data.phone || '', idNumber: data.idNumber || '' });
                if (exists) {
                    showToast('error', 'User with this email or phone already exists');
                    return;
                }

                // Create account
                await register({
                    email: data.email!,
                    password: data.password!,
                    name: data.fullName.trim(),
                    phone: data.phone || '',
                    country: data.country,
                    accountType: data.accountType,
                    idType: data.idType,
                    idNumber: data.idNumber,
                    acceptTerms,
                    acceptPrivacy,
                    acceptKyc,
                });
                showToast('success', 'Account created successfully. Choose your onboarding path next.', 6000);
                setStep(1);
            } catch (error: any) {
                showToast('error', error.message || 'Registration failed');
            } finally {
                setIsSaving(false);
            }
        } else if (step === 2) {
            if (!data.businessName.trim()) {
                showToast('error', 'Business Name is required');
                return;
            }
            if (!data.country.trim()) {
                showToast('error', 'Country is required');
                return;
            }
            if (!data.timezone.trim()) {
                showToast('error', 'Timezone is required');
                return;
            }
            if (!data.defaultCurrency.trim()) {
                showToast('error', 'Default currency is required');
                return;
            }
            if (!data.notificationEmail.trim()) {
                showToast('error', 'Notification email is required');
                return;
            }
            if (data.accountType === 'BUSINESS' && !data.username.trim()) {
                showToast('error', 'Username is required for business accounts');
                return;
            }
            if (data.primaryUseCase === 'api_partner' && !data.website.trim()) {
                showToast('error', 'Website is required for developer onboarding');
                return;
            }
            if (!isQuickStart && !data.industry) {
                showToast('error', 'Please select an industry');
                return;
            }
            if (!isQuickStart && data.employeeCount <= 0) {
                showToast('error', 'Please enter a valid number of employees');
                return;
            }
            if (!isQuickStart && !data.idNumber.trim()) {
                showToast('error', 'ID Number is required for verification');
                return;
            }

            if (isAIOrchestration) {
                try {
                    setIsGeneratingAI(true);
                    const recommendation = await onboardingService.getAIRecommendations({
                        account_type: data.accountType,
                        country: data.country,
                        timezone: data.timezone,
                        default_currency: data.defaultCurrency,
                        notification_email: data.notificationEmail || data.email || '',
                        business_name: data.businessName,
                        industry: data.industry,
                        employee_count: data.employeeCount,
                        company_stage: data.companyStage,
                        primary_goal: data.primaryGoal,
                        primary_use_case: data.primaryUseCase,
                        website: data.website,
                    });

                    setAiRecommendations(recommendation);
                    setData((prev) => ({
                        ...prev,
                        features: uniqueMerge(prev.features, recommendation.features),
                        apps: uniqueMerge(prev.apps, recommendation.apps),
                        workflows: uniqueMerge(prev.workflows, recommendation.workflows),
                    }));
                } catch (error) {
                    console.error('Failed to load AI onboarding recommendations:', error);
                    showToast('error', 'AI recommendations are unavailable right now. Using smart defaults.');
                    setAiRecommendations(null);
                    seedPathDefaults();
                } finally {
                    setIsGeneratingAI(false);
                }
            } else {
                seedPathDefaults();
            }
            advanceStep();
        } else {
            advanceStep();
        }
    };

    const handleSendCode = async (channel: 'email' | 'whatsapp') => {
        if (channel === 'whatsapp' && !data.phone) {
            showToast('error', 'Please provide a phone number for WhatsApp verification');
            return;
        }
        try {
            setIsSaving(true);
            await authApi.sendVerificationCode(channel, channel === 'email' ? data.email! : data.phone!);
            setVerificationChannel(channel);
            showToast('success', `Verification code sent to your ${channel}`);
        } catch (error) {
            showToast('error', 'Failed to send code');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrev = () => {
        if (visibleStepIndex > 0) retreatStep();
    };

    const handleComplete = async () => {
        await completeOnboarding();
    };

    const handlePathSelection = (path: 'guided' | 'ai' | 'quick') => {
        setOnboardingPath(path);
        if (path === 'quick') {
            if (!isAuthenticated) {
                setStep(0);
                return;
            }
            void completeOnboarding('quick');
            return;
        }
        setStep(2);
    };

    const toggleFeature = (feature: string) => {
        setData({
            ...data,
            features: data.features.includes(feature)
                ? data.features.filter(f => f !== feature)
                : [...data.features, feature]
        });
    };

    const toggleApp = (app: string) => {
        setData({
            ...data,
            apps: data.apps.includes(app)
                ? data.apps.filter(a => a !== app)
                : [...data.apps, app]
        });
    };

    const toggleWorkflow = (workflow: string) => {
        setData({
            ...data,
            workflows: data.workflows.includes(workflow)
                ? data.workflows.filter(w => w !== workflow)
                : [...data.workflows, workflow]
        });
    };


    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <GlobalBackground />
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 w-full max-w-3xl p-8 text-slate-900 shadow-2xl shadow-slate-200/50">
                {/* Progress Bar (Only show after registration) */}
                {step >= 1 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-400">
                                Step {Math.max(visibleStepIndex + 1, 1)} of {visibleStepCount}
                            </span>
                            <span className="text-sm text-gray-500">
                                {visibleStepCount > 1 ? `${Math.round((Math.max(visibleStepIndex, 0) / (visibleStepCount - 1)) * 100)}% Complete` : '100% Complete'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${visibleStepCount > 1 ? (Math.max(visibleStepIndex, 0) / (visibleStepCount - 1)) * 100 : 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 0: Registration */}
                {step === 0 && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your Corridor Account</h2>
                            <p className="text-slate-600">Start your Financial OS journey. We capture identity details here so onboarding can move faster.</p>
                        </div>
                            <div className="space-y-4 max-w-md mx-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={data.fullName}
                                        onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        placeholder="Ada Lovelace"
                                    />
                                </div>
                            </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData({ ...data, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                                    <h3 className="text-sm font-bold text-slate-900">Identity details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                                        <PhoneInput
                                            value={data.phone || ''}
                                            onChange={(phone) => setData({ ...data, phone })}
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                                            <input
                                                type="text"
                                                value={data.country}
                                                onChange={(e) => setData({ ...data, country: e.target.value.toUpperCase() })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                placeholder="KE"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Account Type</label>
                                            <select
                                                value={data.accountType}
                                                onChange={(e) => setData({ ...data, accountType: e.target.value as OnboardingData['accountType'] })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            >
                                                <option value="PERSONAL">Personal</option>
                                                <option value="BUSINESS">Business</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ID Type</label>
                                            <select
                                                value={data.idType}
                                                onChange={(e) => setData({ ...data, idType: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            >
                                                <option value="national_id">National ID</option>
                                                <option value="passport">Passport</option>
                                                <option value="driving_license">Driving License</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ID Number</label>
                                            <input
                                                type="text"
                                                value={data.idNumber}
                                                onChange={(e) => setData({ ...data, idNumber: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                placeholder="Enter ID Number"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData({ ...data, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={isSaving}
                                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                {isSaving ? 'Creating account...' : 'Create account'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <p className="text-center text-sm text-slate-500 mt-4">
                                Already have an account? <a href="/login" className="text-blue-600 hover:underline font-semibold">Log in</a>
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 1: Path Selection */}
                {step === 1 && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Corridor!</h2>
                            <p className="text-slate-600">How would you like to get started?</p>
                        </div>
                        <div className="grid gap-4">
                            <button
                                onClick={() => handlePathSelection('guided')}
                                className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                        <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Guided Setup</h3>
                                        <p className="text-sm text-slate-600">Step-by-step wizard to configure your account</p>
                                        <p className="text-xs text-slate-500 mt-2">⏱️ Takes about 3 minutes</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handlePathSelection('ai')}
                                className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:border-purple-500 hover:bg-purple-50/50 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                                        <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">AI Orchestration</h3>
                                        <p className="text-sm text-slate-600">We infer your best features, workflows, and dashboard layout from your business profile</p>
                                        <p className="text-xs text-purple-600 mt-2 font-medium">Recommended defaults. You can edit everything before completion.</p>
                                        <p className="text-xs text-slate-500 mt-2">⏱️ Takes about 2 minutes</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handlePathSelection('quick')}
                                className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:border-green-500 hover:bg-green-50/50 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                        <Rocket className="w-6 h-6 text-green-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Quick Start</h3>
                                        <p className="text-sm text-slate-600">Skip setup and explore with default settings</p>
                                        <p className="text-xs text-slate-500 mt-2">⏱️ Instant access</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-500" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Business Information & KYC */}
                {step === 2 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {isQuickStart ? 'Quick start setup' : isAIOrchestration ? 'Business signals for AI setup' : 'Business & Identity'}
                                </h2>
                                <p className="text-slate-600">
                                    {isQuickStart
                                        ? 'We only need the essentials to get you live fast.'
                                        : isAIOrchestration
                                            ? 'Give us the signals we need to preconfigure features and workflows.'
                                            : 'Tell us about your business and verify your identity'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <input
                                    id="onboardAcceptTerms"
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="onboardAcceptTerms" className="text-sm text-slate-700 leading-6">
                                    I agree to the <a href="/legal" className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950">Terms of Service</a>.
                                </label>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    id="onboardAcceptPrivacy"
                                    type="checkbox"
                                    checked={acceptPrivacy}
                                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="onboardAcceptPrivacy" className="text-sm text-slate-700 leading-6">
                                    I have read and agree to the <a href="/privacy" className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950">Privacy Policy</a>.
                                </label>
                            </div>
                            <div className="flex items-start gap-3">
                                <input
                                    id="onboardAcceptKyc"
                                    type="checkbox"
                                    checked={acceptKyc}
                                    onChange={(e) => setAcceptKyc(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="onboardAcceptKyc" className="text-sm text-slate-700 leading-6">
                                    I consent to KYC verification and compliance checks.
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={data.businessName}
                                    onChange={(e) => setData({ ...data, businessName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder="Acme Corporation"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Account Type</label>
                                    <select
                                        value={data.accountType}
                                        onChange={(e) => setData({ ...data, accountType: e.target.value as OnboardingData['accountType'] })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    >
                                        <option value="PERSONAL">Personal</option>
                                        <option value="BUSINESS">Business</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData({ ...data, username: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder="@acme or acme_payments"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={data.country}
                                        onChange={(e) => setData({ ...data, country: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder="KE"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Timezone</label>
                                    <input
                                        type="text"
                                        value={data.timezone}
                                        onChange={(e) => setData({ ...data, timezone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder="Africa/Nairobi"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Default Currency</label>
                                    <select
                                        value={data.defaultCurrency}
                                        onChange={(e) => setData({ ...data, defaultCurrency: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    >
                                        <option value="KES">KES</option>
                                        <option value="USD">USD</option>
                                        <option value="USDC">USDC</option>
                                        <option value="NGN">NGN</option>
                                        <option value="GHS">GHS</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Notification Email</label>
                                    <input
                                        type="email"
                                        value={data.notificationEmail}
                                        onChange={(e) => setData({ ...data, notificationEmail: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder={data.email || 'ops@company.com'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Primary Use Case</label>
                                    <select
                                        value={data.primaryUseCase}
                                        onChange={(e) => setData({ ...data, primaryUseCase: e.target.value as OnboardingData['primaryUseCase'] })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    >
                                        <option value="full_platform">Full Platform</option>
                                        <option value="social_only">Social Payments</option>
                                        <option value="ewa_only">Earned Wage Access</option>
                                        <option value="api_partner">API Integration</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Company Stage</label>
                                    <select
                                        value={data.companyStage}
                                        onChange={(e) => setData({ ...data, companyStage: e.target.value as OnboardingData['companyStage'] })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    >
                                        <option value="solo">Solo / Founder-led</option>
                                        <option value="startup">Startup</option>
                                        <option value="growth">Growth</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Industry</label>
                                    <select
                                        value={data.industry}
                                        onChange={(e) => setData({ ...data, industry: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select industry</option>
                                        <option value="fintech">Fintech</option>
                                        <option value="retail">Retail</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="healthcare">Healthcare</option>
                                        <option value="technology">Technology</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Employees</label>
                                    <input
                                        type="number"
                                        value={data.employeeCount || ''}
                                        onChange={(e) => setData({ ...data, employeeCount: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Primary Goal</label>
                                <input
                                    type="text"
                                    value={data.primaryGoal}
                                    onChange={(e) => setData({ ...data, primaryGoal: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    placeholder={isAIOrchestration ? 'Example: Automate payroll, payouts, and customer collections' : 'Example: Launch payments and goals quickly'}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    {isAIOrchestration
                                        ? 'AI uses this to recommend your dashboard layout, features, and workflows.'
                                        : 'This helps us tune your setup and future recommendations.'}
                                </p>
                            </div>

                            {data.primaryUseCase === 'api_partner' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Business Website <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData({ ...data, website: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        placeholder="https://yourcompany.com"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Required for developer onboarding so we can verify the business that will use the API.
                                    </p>
                                </div>
                            )}

                            {isQuickStart && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                                        <div>
                                            <h3 className="font-bold text-emerald-900">Quick start defaults</h3>
                                            <p className="text-sm text-emerald-700">
                                                We’ll enable a starter workspace with payments, invoicing, and social payments. You can expand later in settings.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Identity Verification (KYC)</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    These details are collected at registration now. Review them here if you need to update a value before finishing setup.
                                </p>
                                <SettingsAccordion defaultActiveKeys={['personal-info']}>
                                    <AccordionItem
                                        title="Personal Information"
                                        subtitle="Your basic details"
                                        eventKey="personal-info"
                                        icon={<User className="w-4 h-4" />}
                                    >
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={data.firstName}
                                                        onChange={(e) => setData({ ...data, firstName: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                        placeholder="First Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
                                                    <input
                                                        type="text"
                                                        value={data.lastName}
                                                        onChange={(e) => setData({ ...data, lastName: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                        placeholder="Last Name"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem
                                        title="Identity Documents"
                                        subtitle="Verify your identity"
                                        eventKey="identity-docs"
                                        icon={<FileText className="w-4 h-4" />}
                                    >
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">ID Type</label>
                                                    <select
                                                        value={data.idType}
                                                        onChange={(e) => setData({ ...data, idType: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="national_id">National ID</option>
                                                        <option value="passport">Passport</option>
                                                        <option value="driving_license">Driving License</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">ID Number</label>
                                                    <div className="relative">
                                                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <input
                                                            type="text"
                                                            value={data.idNumber}
                                                            onChange={(e) => setData({ ...data, idNumber: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                            placeholder="Enter ID Number"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Upload clear photos of both sides of your ID document. The document must be valid and not expired.
                                            </div>
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem
                                        title="Contact Information"
                                        subtitle="How we reach you"
                                        eventKey="contact-info"
                                        icon={<Mail className="w-4 h-4" />}
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                    <input
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData({ ...data, email: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                        placeholder="Email Address"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                                                <PhoneInput
                                                    value={data.phone || ''}
                                                    onChange={(phone) => setData({ ...data, phone })}
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                            {isAIOrchestration && (
                                                <div className="text-sm text-slate-500">
                                                    We use your contact details to configure notifications, approvals, and smart reminders automatically.
                                                </div>
                                            )}
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem
                                        title="Security Settings"
                                        subtitle="Protect your account"
                                        eventKey="security-settings"
                                        icon={<Lock className="w-4 h-4" />}
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={data.password}
                                                        onChange={(e) => setData({ ...data, password: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                        placeholder="Password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                                            </div>
                                        </div>
                                    </AccordionItem>
                                </SettingsAccordion>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Feature Selection */}
                {step === 3 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {isAIOrchestration ? 'AI feature recommendations' : isQuickStart ? 'Starter feature pack' : 'Select Features'}
                                </h2>
                                <p className="text-slate-600">
                                    {isAIOrchestration
                                        ? 'Corridor AI generated a workspace based on your business profile. Edit anything before continuing.'
                                        : isQuickStart
                                            ? 'Your starter workspace is ready. Review the core features we will enable.'
                                            : 'Choose the features you need'}
                                </p>
                            </div>
                        </div>
                        {isAIOrchestration && aiRecommendations && (
                            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                                <p className="text-sm font-semibold text-purple-900 mb-1">AI summary</p>
                                <p className="text-sm text-purple-800">{aiRecommendations.summary}</p>
                                <p className="text-xs text-purple-700 mt-2">{aiRecommendations.reasoning}</p>
                            </div>
                        )}
                        {isQuickStart ? (
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    {recommendedFeatures.map((featureId) => {
                                        const feature = FEATURE_LIBRARY.find((item) => item.id === featureId)!;
                                        return (
                                            <div key={feature.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-bold text-slate-900 leading-tight">{feature.name}</h3>
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <p className="text-sm text-slate-500">{feature.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <p className="text-sm text-slate-600">
                                        Quick start will enable these features automatically. You can add or remove capabilities later from Settings and the Developer Hub.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {FEATURE_LIBRARY.map((feature) => {
                                    const isRecommended = isAIOrchestration && aiFeatureRecommendations.includes(feature.id);
                                    const selected = data.features.includes(feature.id);
                                    return (
                                        <button
                                            key={feature.id}
                                            onClick={() => toggleFeature(feature.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selected
                                                ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20'
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-slate-900 leading-tight">{feature.name}</h3>
                                                {selected && (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{feature.desc}</p>
                                        {isAIOrchestration && isRecommended && (
                                            <p className="text-xs text-blue-600 mt-2 font-medium">Recommended by AI</p>
                                        )}
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Automations & Workflows */}
                {step === 4 && !isAIOrchestration && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <Workflow className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {isAIOrchestration ? 'AI workflow recommendations' : isQuickStart ? 'Automation starter pack' : 'Workflows & Automations'}
                                </h2>
                                <p className="text-slate-600">
                                    {isAIOrchestration
                                        ? 'These workflows were inferred from your goals and company profile.'
                                        : isQuickStart
                                            ? 'We enabled a minimal starter automation set.'
                                            : 'Select pre-built financial flows'}
                                </p>
                            </div>
                        </div>
                        {isQuickStart ? (
                            <div className="grid gap-3">
                                {recommendedWorkflows.map((workflowId) => {
                                    const wf = WORKFLOW_LIBRARY.find((item) => item.id === workflowId)!;
                                    return (
                                        <div key={wf.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{wf.name}</h4>
                                                    <p className="text-sm text-slate-500">{wf.desc}</p>
                                                </div>
                                                <Check className="w-5 h-5 text-amber-600" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {WORKFLOW_LIBRARY.map((wf) => {
                                    const selected = data.workflows.includes(wf.id);
                                    return (
                                        <button
                                            key={wf.id}
                                            onClick={() => toggleWorkflow(wf.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{wf.name}</h4>
                                                    <p className="text-sm text-slate-500">{wf.desc}</p>
                                                </div>
                                                {selected && <Check className="w-5 h-5 text-blue-600" />}
                                            </div>
                                            {isAIOrchestration && selected && (
                                                <p className="text-xs text-blue-600 mt-2 font-medium">Recommended by AI</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Workspace apps</h3>
                                    <p className="text-sm text-slate-600">Choose the modules that should appear in the sidebar and dashboard.</p>
                                </div>
                                {(isAIOrchestration || isQuickStart) && (
                                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                                        {isQuickStart ? 'Starter layout' : 'AI suggested'}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {APP_LIBRARY.map((app) => {
                                    const selected = data.apps.includes(app.id);
                                    const recommended = (isAIOrchestration ? aiAppRecommendations : recommendedApps).includes(app.id);
                                    return (
                                        <button
                                            key={app.id}
                                            onClick={() => toggleApp(app.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selected
                                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-slate-900">{app.name}</h4>
                                                {selected && <Check className="w-5 h-5 text-emerald-600" />}
                                            </div>
                                            <p className="text-sm text-slate-500">{app.desc}</p>
                                            {recommended && (
                                                <p className="text-xs text-emerald-700 mt-2 font-medium">
                                                    {isAIOrchestration ? 'Recommended by AI' : isQuickStart ? 'Enabled for your starter layout' : 'Suggested for your setup'}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                    {visibleStepIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                    )}
                    {!isLastVisibleStep ? (
                        <button
                            onClick={handleNext}
                            disabled={isSaving || isGeneratingAI}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-slate-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isGeneratingAI && step === 2 ? 'Generating AI...' : 'Next'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : isLastVisibleStep ? (
                        <button
                            onClick={handleComplete}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-emerald-600/20"
                        >
                            Complete Setup
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
