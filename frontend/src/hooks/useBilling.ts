import { useState, useEffect, useCallback } from "react";
import { billingApi } from "../api/billing";
import { useAuthStore } from "../store/authStore";
import {
  initializeBilling,
  getCurrentBillingPackages,
  purchaseBillingPackage,
  restoreBillingPurchases,
  presentBillingPaywall,
  PAYDAY_PRO_ENTITLEMENT,
  BILLING_PACKAGE_IDS,
  BillingCustomerInfo,
  BillingPackageSummary,
} from "../services/billing";

export interface UseBillingReturn {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: BillingCustomerInfo | null;
  availablePackages: BillingPackageSummary[];
  error: string | null;
  purchase: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; hasActiveSubscription: boolean; error?: string }>;
  refreshCustomerInfo: () => Promise<void>;
  presentHostedPaywall: (container: HTMLElement) => Promise<{ success: boolean; error?: string }>;
  productPlan: string | null;
}

function derivePlanFromUser(user: any): string | null {
  const settings = user?.settings || {};
  const billingPackage = String(settings.billing_package_id || settings.billing_package || "").toLowerCase();
  if (["monthly", "yearly", "lifetime"].includes(billingPackage)) {
    return billingPackage;
  }

  const tier = String(user?.user_tier || "").toUpperCase();
  if (tier === "PRO" || tier === "PREMIUM") {
    const expiresAt = user?.subscription_expires_at;
    if (expiresAt) {
      const expiry = new Date(expiresAt).getTime();
      if (!Number.isNaN(expiry) && expiry > new Date("2090-01-01T00:00:00Z").getTime()) {
        return "lifetime";
      }
    }
    return "monthly";
  }
  return null;
}

function hasActiveEntitlement(user: any): boolean {
  const tier = String(user?.user_tier || "").toUpperCase();
  if (!(tier === "PRO" || tier === "PREMIUM")) {
    return false;
  }

  const status = String(user?.subscription_status || "active").toLowerCase();
  if (["cancelled", "expired", "inactive"].includes(status)) {
    return false;
  }

  const expiresAt = user?.subscription_expires_at;
  if (!expiresAt) return true;

  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry > Date.now();
}

export const useBilling = (): UseBillingReturn => {
  const { user, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<BillingCustomerInfo | null>(null);
  const [availablePackages, setAvailablePackages] = useState<BillingPackageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [productPlan, setProductPlan] = useState<string | null>(null);

  const refreshCustomerInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setCustomerInfo(null);
        setAvailablePackages([]);
        setIsPro(false);
        setProductPlan(null);
        setError(null);
        return;
      }

      initializeBilling(`corridor_${user.id}`);
      const account = user as any;
      const packages = await getCurrentBillingPackages();
      setAvailablePackages(packages);

      const active = hasActiveEntitlement(account);
      const inferredPlan = derivePlanFromUser(account);

      setIsPro(active);
      setProductPlan(inferredPlan);
      setCustomerInfo({
        raw: account,
        entitlements: active ? { [PAYDAY_PRO_ENTITLEMENT]: true } : {},
        activeEntitlements: active ? { [PAYDAY_PRO_ENTITLEMENT]: true } : {},
        productPlan: inferredPlan,
        expirationDate: account?.subscription_expires_at || null,
        originalPurchaseDate: null,
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh subscription info");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCustomerInfo();
  }, [refreshCustomerInfo]);

  useEffect(() => {
    if (!user) return;
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success" || params.has("checkout") || params.has("session_id")) {
      window.history.replaceState({}, document.title, cleanUrl);
      void refreshUser();
    }
  }, [user, refreshUser]);

  const purchase = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      const result = await purchaseBillingPackage(productId);
      if (!result.success) {
        return { success: false, error: result.error || "Checkout initialization failed" };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Checkout failed" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await restoreBillingPurchases();
      await Promise.all([refreshUser(), refreshCustomerInfo()]);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, refreshCustomerInfo]);

  const presentHostedPaywall = useCallback(async (_container: HTMLElement) => {
    try {
      const portal = await billingApi.getCustomerPortal();
      if (!portal?.portal_url) {
        const result = await presentBillingPaywall();
        return { success: false, error: result.error || "Customer portal unavailable" };
      }
      window.location.href = portal.portal_url;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Customer portal unavailable" };
    }
  }, []);

  return {
    isPro,
    isLoading,
    customerInfo,
    availablePackages,
    error,
    purchase,
    restore,
    refreshCustomerInfo,
    presentHostedPaywall,
    productPlan,
  };
};

export const useBillingStatus = (): boolean => {
  const { isPro } = useBilling();
  return isPro;
};

export { BILLING_PACKAGE_IDS, PAYDAY_PRO_ENTITLEMENT };
