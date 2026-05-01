import React, { useEffect, useMemo, useState } from "react";
import { Check, X, Crown, CreditCard, Loader2 } from "lucide-react";
import { useBilling, BILLING_PACKAGE_IDS } from "../hooks/useBilling";
import {
  CANONICAL_PRICING_CATALOG,
  PRO_BILLING_PACKAGES,
  normalizeProPackageId,
} from "../config/pricingCatalog";

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SelectablePlan = {
  id: string;
  canonicalId: "monthly" | "yearly" | "lifetime";
  name: string;
  priceLabel: string;
  interval: string;
  description: string;
  popular: boolean;
};

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    purchase,
    restore,
    presentHostedPaywall,
    availablePackages,
    isLoading,
    error,
  } = useBilling();

  const plans = useMemo<SelectablePlan[]>(() => {
    if (availablePackages.length > 0) {
      return availablePackages
        .map((pkg) => {
          const canonicalId = pkg.normalizedIdentifier || normalizeProPackageId(pkg.productIdentifier);
          if (!canonicalId) return null;
          const fallback = PRO_BILLING_PACKAGES.find((option) => option.packageId === canonicalId);
          return {
            id: pkg.identifier,
            canonicalId,
            name: fallback?.name || pkg.title,
            priceLabel: pkg.priceLabel || fallback?.fallbackPriceLabel || "Contact sales",
            interval: fallback?.intervalLabel || "period",
            description: pkg.description || fallback?.description || "",
            popular: canonicalId === BILLING_PACKAGE_IDS.yearly,
          };
        })
        .filter(Boolean) as SelectablePlan[];
    }

    return PRO_BILLING_PACKAGES.map((option) => ({
      id: option.packageId,
      canonicalId: option.packageId,
      name: option.name,
      priceLabel: option.fallbackPriceLabel,
      interval: option.intervalLabel,
      description: option.description,
      popular: option.packageId === BILLING_PACKAGE_IDS.yearly,
    }));
  }, [availablePackages]);

  const defaultPlanId = plans.find((plan) => plan.canonicalId === BILLING_PACKAGE_IDS.yearly)?.id || plans[0]?.id || BILLING_PACKAGE_IDS.monthly;
  const [selectedPlan, setSelectedPlan] = useState<string>(defaultPlanId);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const selectedCanonicalPlan = plans.find((plan) => plan.id === selectedPlan)?.canonicalId || BILLING_PACKAGE_IDS.yearly;
  const selectedPlanMeta = plans.find((plan) => plan.id === selectedPlan);

  useEffect(() => {
    if (plans.length > 0) {
      setSelectedPlan((current) => {
        const exists = plans.some((plan) => plan.id === current);
        return exists ? current : defaultPlanId;
      });
    }
  }, [plans, defaultPlanId]);

  if (!isOpen) return null;

  const proPlan = CANONICAL_PRICING_CATALOG.find((plan) => plan.slug === "pro");

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await purchase(selectedPlan);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else if (result.error !== "Purchase cancelled") {
        setPurchaseError(result.error || "Purchase failed");
      }
    } catch (err: any) {
      setPurchaseError(err?.message || "An unexpected error occurred");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      await restore();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setPurchaseError(err?.message || "Sync failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleHostedPaywall = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await presentHostedPaywall(document.body);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setPurchaseError(result.error || "Unable to open hosted paywall");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white font-semibold text-sm mb-4">
                <Crown className="w-4 h-4" />
                Upgrade to Payday Pro
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Unlock Payday Pro</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a billing option and unlock the full Payday Pro entitlement.
              </p>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
                {plans.map((plan) => (
                  <button
                    key={plan.canonicalId}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      selectedCanonicalPlan === plan.canonicalId
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-300 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedPlanMeta && (
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-current" />
                  {selectedPlanMeta.name} selected
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "border-orange-500 bg-orange-50/70 dark:bg-orange-900/20 shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_20px_40px_rgba(249,115,22,0.10)]"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                      BEST VALUE
                    </div>
                  )}

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.priceLabel}</span>
                    {plan.interval !== "lifetime" && <span className="text-gray-500">/{plan.interval}</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>

                  <button
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      selectedPlan === plan.id
                        ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What's included in Payday Pro:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(proPlan?.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {(error || purchaseError) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{purchaseError || error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Start checkout
                      </>
                    )}
                </button>

              <button
                onClick={handleRestore}
                disabled={isPurchasing || isLoading}
                className="py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Sync access
              </button>
            </div>

            <button
              onClick={handleHostedPaywall}
              disabled={isPurchasing || isLoading}
              className="w-full mt-3 py-2.5 px-4 border border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 disabled:opacity-50"
            >
              Open customer portal
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew unless cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
