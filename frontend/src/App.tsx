import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { CookieConsent } from './components/CookieConsent';
import Landing from './pages/Landing';
import DocsPage from './pages/DocsPage';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import Legal from './pages/Legal';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Changelog from './pages/Changelog';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { DeveloperHub } from './pages/developers/DeveloperHub';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/ThemeContext';
import Marketplace from './pages/Marketplace';
import { Team } from './pages/Team';
import { AccountIntegrations } from './pages/AccountIntegrations';
import { Usage } from './pages/Usage';
import { Billing } from './pages/Billing';
import { Automations } from './pages/Automations';
import WorkflowBuilder from './apps/Workflows/WorkflowBuilder';
import CustomersApp from './apps/Customers/CustomersApp';
import Treasury from './pages/Treasury';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BankConnectors from './pages/BankConnectors';
import Payouts from './pages/Payouts';
import MassPayouts from './pages/MassPayouts';
import PaymentLinks from './pages/PaymentLinks';
import SubscriptionManager from './pages/SubscriptionManager';
import NetworkDashboard from './pages/NetworkDashboard';
import GroupPayments from './pages/GroupPayments';
import { EmployeeEwa } from './pages/EmployeeEwa';
import { Goals } from './pages/social/Goals';
import { CreateGoal } from './pages/social/CreateGoal';
import { CreateChama } from './pages/social/CreateChama';
import { CreateSplitBill } from './pages/social/CreateSplitBill';
import { GoalDetail } from './pages/social/GoalDetail';
import { Feed } from './pages/social/Feed';
import { BorderlessPay } from './pages/finance/BorderlessPay';
import Cards from './pages/finance/Cards';
import { Payroll } from './pages/finance/Payroll';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PublicInvoice from './pages/PublicInvoice';
import InvoicePayPage from './pages/InvoicePay';
import PaymentLinkPay from './pages/PaymentLinkPay';
import AddFundsPage from './pages/AddFunds';
import { DashboardSkeleton } from './components/ui/Skeletons';
import { NetworkStatusWatcher } from './components/NetworkStatusWatcher';

import Status from './pages/Status';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { clearPendingUpgradePlan, getPendingUpgradePlan, hasActiveTierForPlan } from './utils/upgradeIntent';
import WalletSetup from './pages/Onboarding';
import { needsWalletSetup } from './utils/walletSetup';
import { needsLegalAcceptance } from './utils/legalConsent';

const FullScreenLoader = () => (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
        <DashboardSkeleton />
    </div>
);

const getGateRedirectTarget = (
    pathname: string,
    search: string,
    user: any,
    isAuthenticated: boolean
) => {
    const onboardingCompleted = user?.onboarding_completed === true;
    const legalAccepted = !needsLegalAcceptance(user);
    const fullName = String(user?.full_name || user?.name || '').trim();
    const phone = String(user?.whatsapp_phone || user?.phone || '').trim();
    const profileCompleted = fullName.length > 1 && phone.length > 0;
    const kycStatus = String(user?.kyc_status || '').toUpperCase();
    const kycCompleted = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(kycStatus);
    const needsComplianceCompletion = isAuthenticated && onboardingCompleted && (!profileCompleted || !kycCompleted);
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isSettingsRoute = pathname.startsWith('/settings');
    const isPublicInvoiceRoute = pathname.startsWith('/invoice/');
    const isPayInvoiceRoute = pathname.startsWith('/pay/invoice/');
    const isPaymentLinkRoute = pathname.startsWith('/pay/');
    const isLegalRoute = pathname.startsWith('/legal') || pathname.startsWith('/privacy');
    const isSubscriptionRoute = pathname.startsWith('/subscription');
    const isWalletSetupRoute = pathname.startsWith('/wallet-setup');
    const pendingUpgradePlan = getPendingUpgradePlan();
    const requiresPaidUpgrade = Boolean(
        isAuthenticated &&
        onboardingCompleted &&
        pendingUpgradePlan &&
        !hasActiveTierForPlan(user, pendingUpgradePlan)
    );
    const isPublicRoute =
        pathname.startsWith('/landing') ||
        pathname.startsWith('/pricing') ||
        pathname.startsWith('/status') ||
        pathname.startsWith('/legal') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/changelog') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/docs') ||
        isPublicInvoiceRoute ||
        isPayInvoiceRoute ||
        isPaymentLinkRoute;

    if (!isAuthenticated && pathname === '/') {
        return '/landing';
    }

    if (!isAuthenticated && !isPublicRoute) {
        return '/login';
    }

    if (isAuthenticated && !onboardingCompleted && !isOnboardingRoute && !isPublicInvoiceRoute && !isPayInvoiceRoute && !isPaymentLinkRoute) {
        return '/onboarding';
    }

    if (isAuthenticated && onboardingCompleted && !legalAccepted && !isLegalRoute && !isPublicInvoiceRoute && !isPayInvoiceRoute && !isPaymentLinkRoute) {
        return '/legal?accept=1';
    }

    if (needsComplianceCompletion && !isSettingsRoute && !isPublicInvoiceRoute && !isPayInvoiceRoute && !isPaymentLinkRoute) {
        const requiredTab = !profileCompleted ? 'profile' : 'kyc';
        return `/settings?required=1&tab=${requiredTab}`;
    }

    if (isAuthenticated && onboardingCompleted && needsWalletSetup(user) && !isWalletSetupRoute && !isPublicInvoiceRoute && !isPayInvoiceRoute && !isPaymentLinkRoute) {
        return '/wallet-setup';
    }

    if (isAuthenticated && onboardingCompleted && pathname === '/onboarding') {
        return '/dashboard';
    }

    if (requiresPaidUpgrade && !isSubscriptionRoute) {
        return `/subscription?requiredUpgrade=1&plan=${encodeURIComponent(pendingUpgradePlan!)}`;
    }

    if (pathname === '/') {
        return isAuthenticated
            ? (!legalAccepted ? '/legal?accept=1' : needsComplianceCompletion ? `/settings?required=1&tab=${!profileCompleted ? 'profile' : 'kyc'}` : '/dashboard')
            : '/landing';
    }

    return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { loading } = useAuthStore();

    if (loading) {
        return <FullScreenLoader />;
    }

    return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuthStore();
    if (loading) {
        return <FullScreenLoader />;
    }
    const role = String((user as any)?.account_type || '').toUpperCase();
    if (role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

const AppGate = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const { user, loading, isAuthenticated } = useAuthStore();
    const redirectTarget = getGateRedirectTarget(location.pathname, location.search, user, isAuthenticated);

    if (loading) {
        return <FullScreenLoader />;
    }

    if (isAuthenticated && getPendingUpgradePlan() && hasActiveTierForPlan(user, getPendingUpgradePlan()!)) {
        clearPendingUpgradePlan();
    }

    if (redirectTarget && `${location.pathname}${location.search}` !== redirectTarget) {
        return <Navigate to={redirectTarget} replace state={{ from: `${location.pathname}${location.search}` }} />;
    }

    return <>{children}</>;
};

function App() {
    const { isAuthenticated } = useAuthStore();
    const user = useAuthStore((state) => state.user);
    const profileCompleted = String((user as any)?.full_name || (user as any)?.name || '').trim().length > 1
        && String((user as any)?.whatsapp_phone || (user as any)?.phone || '').trim().length > 0;
    const kycStatus = String((user as any)?.kyc_status || '').toUpperCase();
    const kycCompleted = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(kycStatus);
    const legalAccepted = !needsLegalAcceptance(user);
    const needsComplianceCompletion = isAuthenticated && user?.onboarding_completed === true && (!profileCompleted || !kycCompleted);

    return (
        <HelmetProvider>
            <ThemeProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppGate>
                        <NetworkStatusWatcher />
                        <Routes>
                            {/* Public Routes with PublicLayout */}
                            <Route element={<PublicLayout><Outlet /></PublicLayout>}>
                                <Route path="/landing" element={<Landing />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/status" element={<Status />} />
                                <Route path="/legal" element={<Legal />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/changelog" element={<Changelog />} />
                            </Route>

                            {/* Un-layouted Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/onboarding" element={<OnboardingWizard />} />
                            <Route path="/wallet-setup" element={<WalletSetup />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/invoice/:id" element={<PublicInvoice />} />
                            <Route path="/pay/invoice/:id" element={<InvoicePayPage />} />
                            <Route path="/pay/:slug" element={<PaymentLinkPay />} />

                             {/* Docs Route */}
                              <Route path="/docs/*" element={<DocsPage />} />

                             {/* Root Redirect Logic */}
                             <Route path="/" element={<div />} />

                            {/* Main Application Routes (Protected) */}
                            <Route element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Outlet />
                                    </Layout>
                                </ProtectedRoute>
                            }>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                                <Route path="add-funds" element={<AddFundsPage />} />
                                <Route path="finance" element={<BorderlessPay />} />
                                <Route path="connectors" element={<Marketplace />} />
                                <Route path="payouts" element={<Payouts />} />
                                <Route path="mass-payouts" element={<MassPayouts />} />
                                <Route path="payment-links" element={<PaymentLinks />} />
                                <Route path="subscription" element={<SubscriptionManager />} />
                                <Route path="network" element={<NetworkDashboard />} />
                                <Route path="groups" element={<GroupPayments />} />
                                <Route path="team" element={<Team />} />
                                <Route path="integrations" element={<AccountIntegrations />} />
                                <Route path="automations" element={<Automations />} />
                                <Route path="usage" element={<Usage />} />
                                <Route path="billing" element={<Billing />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="workflows" element={<WorkflowBuilder />} />
                                <Route path="customers" element={<CustomersApp />} />
                                <Route path="analytics" element={<AnalyticsDashboard />} />
                                <Route path="treasury" element={<Treasury />} />
                                <Route path="bank-connectors" element={<BankConnectors />} />
                                <Route path="developers/*" element={<DeveloperHub />} />
                                <Route path="employee-ewa" element={<EmployeeEwa />} />
                                <Route path="goals" element={<Goals />} />
                                <Route path="goals/new" element={<CreateGoal />} />
                                <Route path="chama/new" element={<CreateChama />} />
                                <Route path="split/new" element={<CreateSplitBill />} />
                                <Route path="goals/:goalId" element={<GoalDetail />} />
                                <Route path="social/feed" element={<Feed />} />
                                <Route path="invoices" element={<Invoices />} />
                                <Route path="invoices/:id" element={<InvoiceDetail />} />
                                <Route path="cards" element={<Cards />} />
                                <Route path="payroll" element={<Payroll />} />
                            </Route>

                            {/* Catch all */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </AppGate>
                    <CookieConsent />
                </Router>
            </ThemeProvider>
        </HelmetProvider>
    );
}

export default App;
