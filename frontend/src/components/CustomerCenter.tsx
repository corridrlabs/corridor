import React from "react";
import {
  Crown,
  CreditCard,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2,
  Shield,
} from "lucide-react";
import { useBilling } from "../hooks/useBilling";
import { format } from "date-fns";
import { CANONICAL_PRICING_CATALOG, PRO_BILLING_PACKAGES, getProBillingPackage } from "../config/pricingCatalog";

interface CustomerCenterProps {
  onUpgrade?: () => void;
}

export const CustomerCenter: React.FC<CustomerCenterProps> = ({ onUpgrade }) => {
  const {
    isPro,
    isLoading,
    customerInfo,
    productPlan,
    error,
    refreshCustomerInfo,
    presentHostedPaywall,
  } = useBilling();

  if (isLoading && !customerInfo) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={refreshCustomerInfo}
          className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
            <Crown className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Upgrade to Payday Pro</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unlock all premium features</p>
          </div>
        </div>
        <button
          onClick={onUpgrade}
          className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          View Plans
        </button>
      </div>
    );
  }

  const selectedBillingPackage = getProBillingPackage(productPlan);
  const proPlan = CANONICAL_PRICING_CATALOG.find((plan) => plan.slug === "pro");

  const expirationDate = customerInfo?.expirationDate
    ? new Date(customerInfo.expirationDate).getUTCFullYear() >= 9000
      ? "Lifetime"
      : format(new Date(customerInfo.expirationDate), "MMMM d, yyyy")
    : "Lifetime";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">{selectedBillingPackage?.name || "Payday Pro"}</h3>
              <p className="text-white/80 text-sm">Lemon Squeezy direct billing entitlement: Payday Pro</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Active</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Billing</p>
            <p className="font-medium">{selectedBillingPackage?.intervalLabel === "lifetime" ? "One-time" : "Recurring"}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Next Payment</p>
            <p className="font-medium">{expirationDate}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Your Benefits</h4>
        <div className="space-y-3">
          {(proPlan?.features || []).map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Billing variants</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRO_BILLING_PACKAGES.map((variant) => (
            <button
              key={variant.packageId}
              type="button"
              onClick={() => void presentHostedPaywall(document.body)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900 dark:text-white">{variant.name}</div>
                <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">{variant.intervalLabel}</span>
              </div>
              <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{variant.fallbackPriceLabel}</div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{variant.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Subscription Details</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Start Date</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {customerInfo?.originalPurchaseDate
                ? format(new Date(customerInfo.originalPurchaseDate), "MMMM d, yyyy")
                : "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Managed by Lemon Squeezy</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Subscription Status</span>
            </div>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={refreshCustomerInfo}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Sync Status
        </button>
        <button
          onClick={() => void presentHostedPaywall(document.body)}
          className="flex-1 py-2.5 px-4 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          Open portal
        </button>
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">Need help? Contact us at jamesthaura51@gmail.com</p>
    </div>
  );
};

export default CustomerCenter;
