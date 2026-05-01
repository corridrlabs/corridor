import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, Zap, ArrowRight, Plus,
  Layers, Bot, Building2, Globe, Shield, Key, Network,
  TrendingUp, Activity, CreditCard, FileText, SlidersHorizontal, X, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountApi, FeatureAccessMap, LiquidityStats, EWASettings } from '../api/account';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { DashboardTour } from '../components/dashboard/DashboardTour';
import { useDashboardPreferences } from '../hooks/useDashboardPreferences';
import { DashboardSkeleton } from '../components/ui/Skeletons';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [liquidity, setLiquidity] = useState<LiquidityStats | null>(null);
  const [ewaSettings, setEwaSettings] = useState<EWASettings | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [activeTourTarget, setActiveTourTarget] = useState<string | null>(null);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccessMap>({});
  const userId = (user as any)?.id;
  const { preferences, updatePreference, resetPreferences } = useDashboardPreferences(userId);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResult, ewaResult, feedResult, settingsResult, notesResult, featureAccessResult] = await Promise.allSettled([
          accountApi.getLiquidityStats(),
          accountApi.getEWASettings(),
          accountApi.getActivity(10),
          accountApi.getSettings(),
          accountApi.getNotifications(),
          accountApi.getFeatureAccess(),
        ]);

        if (statsResult.status === 'fulfilled') {
          setLiquidity(statsResult.value);
        }

        if (ewaResult.status === 'fulfilled') {
          setEwaSettings(ewaResult.value);
        }

        if (feedResult.status === 'fulfilled') {
          setActivities(feedResult.value.activities.map((a: any, i: number) => ({
            id: i.toString(),
            type: a.type === 'payment' ? 'success' : 'info',
            description: a.description,
            time: 'Recently',
            amount: a.amount,
            currency: a.currency
          })));
        }

        if (settingsResult.status === 'fulfilled') {
          setUserSettings(settingsResult.value);
        }

        if (notesResult.status === 'fulfilled') {
          setNotifications(notesResult.value || []);
        }

        if (featureAccessResult.status === 'fulfilled') {
          setFeatureAccess(featureAccessResult.value || {});
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const forceTour = localStorage.getItem('corridor-force-tour') === '1';
    const seenKey = `corridor-tour-seen:${userId}`;
    const hasSeenTour = localStorage.getItem(seenKey) === '1';
    if (forceTour || !hasSeenTour) {
      setShowTour(true);
      localStorage.setItem(seenKey, '1');
      localStorage.removeItem('corridor-force-tour');
    }
  }, [userId]);

  useEffect(() => {
    if (!showTour) return;
    if (!preferences.showStats) updatePreference('showStats', true);
    if (!preferences.showFinanceHub) updatePreference('showFinanceHub', true);
    if (!preferences.showPeopleHub) updatePreference('showPeopleHub', true);
    if (!preferences.showAutomationHub) updatePreference('showAutomationHub', true);
    if (!preferences.showActivity) updatePreference('showActivity', true);
    if (!preferences.showSidebar) updatePreference('showSidebar', true);
  }, [showTour, preferences, updatePreference]);

  const finishTour = () => {
    if (userId) {
      localStorage.setItem(`corridor-tour-seen:${userId}`, '1');
    }
    setShowTour(false);
    setActiveTourTarget(null);
  };

  const mainStats = [
    {
      title: "Total Liquidity (USDC)",
      value: liquidity ? `$${liquidity.total_usdc.toLocaleString()}` : "$0.00",
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Active Automations",
      value: liquidity ? liquidity.active_workflows : "0",
      icon: Bot,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "EWA Available",
      value: liquidity ? `KES ${liquidity.total_kes.toLocaleString()}` : "KES 0",
      icon: Zap,
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Unread Notifications",
      value: String((notifications || []).filter((n: any) => !n?.read).length),
      icon: Activity,
      color: "bg-emerald-50 text-emerald-600"
    },
  ];

  const shouldShowExperienceNudge = Boolean(
    user && ((user as any).onboarding_completed === false || String((user as any).kyc_status || '').toUpperCase() === 'PENDING')
  );

  const HubCard = ({ title, icon: Icon, description, items, color }: any) => (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className={clsx("p-2 rounded-xl", color)}>
          <Icon size={20} />
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 mb-6">{description}</p>
      <div className="space-y-2">
        {items.map((item: any) => (
          <button
            key={item.label}
            onClick={() => {
              const accessState = item.featureKey ? featureAccess[item.featureKey] : undefined;
              const locked = Boolean(accessState && !accessState.allowed);
              if (locked) {
                const requiredPlan = accessState?.required_plan || 'pro';
                navigate(`/subscription?requiredUpgrade=1&plan=${encodeURIComponent(requiredPlan)}`);
                return;
              }
              navigate(item.path);
            }}
            className={clsx(
              "w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors group/item",
              item.featureKey && featureAccess[item.featureKey] && !featureAccess[item.featureKey].allowed
                ? "bg-slate-50/70 text-slate-400 border border-slate-200"
                : "hover:bg-slate-50 text-slate-700"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} className="text-slate-400 group-hover/item:text-slate-900 mt-1" />
              <span>{item.label}</span>
              {item.featureKey && featureAccess[item.featureKey] && !featureAccess[item.featureKey].allowed ? (
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  {String(featureAccess[item.featureKey].required_plan || 'pro')}
                </span>
              ) : null}
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover/item:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  const spacingClass = preferences.layout === 'compact' ? 'space-y-6' : 'space-y-8';
  const tourFocusClass = (targetId: string) =>
    showTour && activeTourTarget === targetId
      ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-100 shadow-2xl'
      : '';

  return (
    <div className={`${spacingClass} pb-20 px-1`}>
      <DashboardTour
        open={showTour}
        onClose={finishTour}
        onFinish={finishTour}
        onStepChange={setActiveTourTarget}
      />

      {/* Header Section */}
      <div id="tour-command-center" className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${tourFocusClass('tour-command-center')}`}>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium">Overview of your business performance.</p>
         </div>
        <div className="flex items-center gap-3">
          <button
            id="tour-customize-button"
            onClick={() => setShowCustomizer((prev) => !prev)}
            className={`px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 ${tourFocusClass('tour-customize-button')}`}
          >
            {showCustomizer ? <X size={16} /> : <SlidersHorizontal size={16} />} Customize
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} /> Configure
          </button>
        </div>
      </div>

      {showCustomizer && (
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Dashboard Customization</h3>
            <button
              onClick={resetPreferences}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <button onClick={() => updatePreference('layout', 'comfortable')} className={`px-3 py-2 rounded-xl border ${preferences.layout === 'comfortable' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-700'}`}>Comfortable Layout</button>
            <button onClick={() => updatePreference('layout', 'compact')} className={`px-3 py-2 rounded-xl border ${preferences.layout === 'compact' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-700'}`}>Compact Layout</button>
            <button onClick={() => updatePreference('showStats', !preferences.showStats)} className={`px-3 py-2 rounded-xl border ${preferences.showStats ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>Stats {preferences.showStats ? 'On' : 'Off'}</button>
            <button onClick={() => updatePreference('showActivity', !preferences.showActivity)} className={`px-3 py-2 rounded-xl border ${preferences.showActivity ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>Activity {preferences.showActivity ? 'On' : 'Off'}</button>
            <button onClick={() => updatePreference('showFinanceHub', !preferences.showFinanceHub)} className={`px-3 py-2 rounded-xl border ${preferences.showFinanceHub ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>Finance Hub {preferences.showFinanceHub ? 'On' : 'Off'}</button>
            <button onClick={() => updatePreference('showPeopleHub', !preferences.showPeopleHub)} className={`px-3 py-2 rounded-xl border ${preferences.showPeopleHub ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>People Hub {preferences.showPeopleHub ? 'On' : 'Off'}</button>
            <button onClick={() => updatePreference('showAutomationHub', !preferences.showAutomationHub)} className={`px-3 py-2 rounded-xl border ${preferences.showAutomationHub ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>Automation Hub {preferences.showAutomationHub ? 'On' : 'Off'}</button>
            <button onClick={() => updatePreference('showSidebar', !preferences.showSidebar)} className={`px-3 py-2 rounded-xl border ${preferences.showSidebar ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-700'}`}>Sidebar {preferences.showSidebar ? 'On' : 'Off'}</button>
          </div>
        </div>
      )}

      {shouldShowExperienceNudge && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Complete setup to unlock your workspace</h3>
              <p className="text-sm text-amber-800">
                {((user as any)?.onboarding_completed === false ? 'Finish onboarding to tailor your workspace.' : '')}
                {((user as any)?.onboarding_completed === false && String((user as any)?.kyc_status || '').toUpperCase() === 'PENDING' ? ' ' : '')}
                {String((user as any)?.kyc_status || '').toUpperCase() === 'PENDING' ? 'Complete KYC to unlock higher limits and account features.' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(user as any)?.onboarding_completed === false && (
              <button
                onClick={() => navigate('/onboarding')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm"
              >
                Complete Onboarding
              </button>
            )}
            {String((user as any)?.kyc_status || '').toUpperCase() === 'PENDING' && (
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 rounded-xl border border-amber-300 text-amber-900 text-sm font-semibold bg-white shadow-sm"
              >
                Review KYC
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Stats */}
      {preferences.showStats && (
        <div id="tour-primary-stats" className={`transition-all ${tourFocusClass('tour-primary-stats')}`}>
          <DashboardStats stats={mainStats} />
        </div>
      )}

      {/* Operational Hubs */}
      {(preferences.showFinanceHub || preferences.showPeopleHub || preferences.showAutomationHub) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {preferences.showFinanceHub && (
            <div id="tour-finance-hub" className={`transition-all ${tourFocusClass('tour-finance-hub')}`}>
              <HubCard
                title="Finance Hub"
                icon={TrendingUp}
                color="bg-blue-50 text-blue-600"
                description="Manage liquidity, invoices, and multi-currency payouts across borders."
                items={[
                  { label: "Invoice Factory", icon: FileText, path: "/invoices" },
                  { label: "Mass Payouts", icon: Layers, path: "/mass-payouts", featureKey: "payouts" },
                  { label: "Treasury Management", icon: Building2, path: "/treasury", featureKey: "treasury" },
                  { label: "Virtual Cards", icon: CreditCard, path: "/cards", featureKey: "cards" },
                ]}
              />
            </div>
          )}
          {preferences.showPeopleHub && (
            <div id="tour-people-hub" className={`transition-all ${tourFocusClass('tour-people-hub')}`}>
              <HubCard
                title="People Hub"
                icon={Users}
                color="bg-emerald-50 text-emerald-600"
                description="Scale your team with borderless payroll and Earned Wage Access."
                items={[
                  { label: "EWA Dashboard", icon: Zap, path: "/payroll", featureKey: "ewa" },
                  { label: "Team Management", icon: Users, path: "/team" },
                  { label: "Payroll Processing", icon: Building2, path: "/payroll", featureKey: "payroll" },
                  { label: "Global Onboarding", icon: Globe, path: "/onboarding" },
                ]}
              />
            </div>
          )}
          {preferences.showAutomationHub && (
            <div id="tour-automation-hub" className={`transition-all ${tourFocusClass('tour-automation-hub')}`}>
              <HubCard
                title="Automation Studio"
                icon={Zap}
                color="bg-purple-50 text-purple-600"
                description="Deploy AI Agents and Scoped Workflows to handle financial complexity."
                items={[
                  { label: "AI Agent Builder", icon: Bot, path: "/ai-workflows", featureKey: "analytics" },
                  { label: "Scoped Workflows", icon: Network, path: "/workflows", featureKey: "workflows" },
                  { label: "Connectors Marketplace", icon: Activity, path: "/bank-connectors" },
                  { label: "Developer Sandbox", icon: Key, path: "/developers", featureKey: "api_access" },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {(preferences.showActivity || preferences.showSidebar) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content: Activity & Wallets */}
          {preferences.showActivity && (
            <div
              id="tour-activity-feed"
              className={`${preferences.showSidebar ? "xl:col-span-2 space-y-8" : "xl:col-span-3 space-y-8"} transition-all ${tourFocusClass('tour-activity-feed')}`}
            >
              <ActivityFeed
                activities={activities}
                onViewAll={() => navigate('/transactions')}
              />
            </div>
          )}

          {/* Sidebar: Status & Quick Tips */}
          {preferences.showSidebar && (
            <div className="space-y-8">
              {/* Liquidity Status */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <h4 className="text-xs font-semibold text-slate-500 mb-4">Liquidity Status</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Vault Status</p>
                      <p className="text-lg font-bold">Stable</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Network</p>
                      <p className="text-sm font-medium text-slate-300">Polygon Mainnet</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    <button
                      onClick={() => accountApi.runRevenueSweep()}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Trigger Sweep
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature Highlight: WhatsApp Pay */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm border border-emerald-100">
                    <Shield size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900">WhatsApp Integration</h4>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Launch payment flows your customers already use. Automated templates and compliance included.
                </p>
                <button
                  onClick={() => navigate('/bank-connectors')}
                  className="text-sm font-bold text-emerald-700 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Configure Connectors <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
