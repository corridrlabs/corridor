import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { CANONICAL_PRICING_CATALOG, PRO_BILLING_PACKAGES, getProBillingPackage } from '../config/pricingCatalog';
import { useBilling } from '../hooks/useBilling';
import Paywall from '../components/Paywall';
import { useAuthStore } from '../store/authStore';
import { BillingCycle, getPlanPeriodLabel, getPlanPrice } from '../utils/pricing';

interface FundingSource {
  id: string;
  type?: string;
  brand?: string;
  last4?: string;
  expiry?: string;
}

const SubscriptionManager = () => {
  const [searchParams] = useSearchParams();
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { user } = useAuthStore();

  const { isPro, productPlan, customerInfo, refreshCustomerInfo, presentHostedPaywall } = useBilling();
  const requiredUpgrade = searchParams.get('requiredUpgrade') === '1';
  const requiredPlan = (searchParams.get('plan') || '').toLowerCase();
  const cycleTone = billingCycle === 'yearly'
    ? {
        pill: 'bg-orange-600 text-white shadow-lg shadow-orange-200',
        accent: 'border-orange-200 bg-orange-50 text-orange-700',
        activeCard: 'border-orange-400 bg-orange-50/70 dark:bg-orange-900/20 shadow-[0_0_0_1px_rgba(249,115,22,0.20)]',
      }
    : {
        pill: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',
        accent: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        activeCard: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]',
      };

  useEffect(() => {
    const loadFundingSources = async () => {
      setLoadingSources(true);
      try {
        const response = await api.get('/funding-sources');
        const payload = Array.isArray(response?.data) ? response.data : [];
        setFundingSources(payload);
      } catch (_error) {
        setFundingSources([]);
      } finally {
        setLoadingSources(false);
      }
    };

    loadFundingSources();
  }, []);

  useEffect(() => {
    if (requiredUpgrade && (requiredPlan === 'pro' || !requiredPlan)) {
      setShowPaywall(true);
    }
  }, [requiredUpgrade, requiredPlan]);

  const primarySource = fundingSources[0];
  const sourceLabel = primarySource
    ? `${(primarySource.brand || primarySource.type || 'Payment method').toUpperCase()} ending in ${primarySource.last4 || '••••'}`
    : 'No payment method connected';

  const freePlan = CANONICAL_PRICING_CATALOG.find((plan) => plan.slug === 'free');
  const billingPackage = getProBillingPackage(productPlan);
  const currentTier = useMemo(() => {
    const rawTier = String(user?.tier || '').trim().toLowerCase();
    if (['free', 'pro', 'premium', 'enterprise'].includes(rawTier)) return rawTier;
    return isPro ? 'pro' : 'free';
  }, [user, isPro]);

  const activePlan = CANONICAL_PRICING_CATALOG.find((plan) => plan.slug === currentTier) || freePlan;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Subscription & Billing</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your plan and billing details.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your plan</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">The subscription page now mirrors the public pricing tiers.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current tier</p>
              <p className="font-bold text-gray-900 dark:text-white capitalize">{activePlan?.name || 'Free'}</p>
            </div>
          </div>

          <div className="mb-6 inline-flex rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-1">
            {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  billingCycle === cycle
                    ? cycleTone.pill
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing'}
              </button>
            ))}
          </div>
          <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${cycleTone.accent}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {billingCycle} pricing active
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            {CANONICAL_PRICING_CATALOG.map((plan) => {
              const isActive = plan.slug === currentTier;
              return (
                <div
                  key={plan.slug}
                  className={`rounded-xl border p-5 transition-colors ${billingCycle === 'yearly' ? 'ring-1 ring-orange-400/15' : 'ring-1 ring-indigo-400/15'} ${
                    isActive
                      ? cycleTone.activeCard
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    {plan.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPlanPrice(plan, billingCycle)}{getPlanPeriodLabel(billingCycle)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                  <div className="mt-4 space-y-2">
                    {plan.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{isActive ? 'Active' : 'Available'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.slug === 'pro') {
                          setShowPaywall(true);
                        }
                      }}
                      className={`text-sm font-medium ${
                        plan.slug === 'pro'
                          ? 'text-indigo-600 hover:text-indigo-700'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={plan.slug !== 'pro'}
                    >
                      {plan.slug === 'pro' ? 'Manage Pro' : 'View'}
                    </button>
                  </div>
                  {plan.slug === 'pro' && (
                    <div className={`mt-4 space-y-2 rounded-lg border p-3 ${cycleTone.accent} dark:bg-opacity-10`}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        Lemon Squeezy billing variants
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {PRO_BILLING_PACKAGES.map((variant) => (
                          <button
                            key={variant.packageId}
                            type="button"
                            onClick={() => setShowPaywall(true)}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                              ((billingCycle === 'yearly' && variant.packageId === 'yearly') ||
                                (billingCycle === 'monthly' && variant.packageId === 'monthly'))
                                ? 'border-indigo-500 bg-white shadow-md dark:bg-gray-900/60 ring-2 ring-indigo-300/40'
                                : 'border-indigo-100 dark:border-indigo-900/40 bg-white/80 dark:bg-gray-900/40 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{variant.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{variant.description}</div>
                            </div>
                            <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                              {variant.fallbackPriceLabel}/{variant.intervalLabel === 'lifetime' ? 'once' : variant.intervalLabel}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {!isPro ? (
              <button
                onClick={() => setShowPaywall(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upgrade Plan
              </button>
            ) : (
              <button
                onClick={refreshCustomerInfo}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Refresh Subscription
              </button>
            )}
            <button
              onClick={() => void presentHostedPaywall(document.body)}
              className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:border-indigo-900/50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              Open Customer Portal
            </button>
          </div>

          {customerInfo?.expirationDate && (
            <p className="text-xs text-gray-500 mt-4">
              {new Date(customerInfo.expirationDate).getUTCFullYear() >= 9000
                ? "Current access is lifetime."
                : `Current access expires on ${new Date(customerInfo.expirationDate).toLocaleDateString()}.`}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
          <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <CreditCard className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{sourceLabel}</p>
              <p className="text-xs text-gray-500">
                {loadingSources ? 'Loading...' : primarySource?.expiry ? `Expires ${primarySource.expiry}` : 'Managed by Lemon Squeezy billing'}
              </p>
            </div>
          </div>
          <button
            onClick={() => void presentHostedPaywall(document.body)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {primarySource ? 'Open customer portal' : 'Connect Payment Method'}
          </button>
        </div>
      </div>

      <Paywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={async () => {
          await refreshCustomerInfo();
          setShowPaywall(false);
        }}
      />
    </div>
  );
};

export default SubscriptionManager;
