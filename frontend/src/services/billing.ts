import { billingApi } from "../api/billing";
import {
  PRO_BILLING_PACKAGES,
  normalizeProPackageId,
} from "../config/pricingCatalog";

export const PAYDAY_PRO_ENTITLEMENT = "Payday Pro";

export const BILLING_PACKAGE_IDS = {
  monthly: "monthly",
  yearly: "yearly",
  lifetime: "lifetime",
} as const;

export type BillingPackageId = keyof typeof BILLING_PACKAGE_IDS;

let initializedUserId: string | null = null;

export interface BillingCustomerInfo {
  raw: any;
  entitlements: Record<string, any>;
  activeEntitlements: Record<string, any>;
  productPlan: string | null;
  expirationDate: string | null;
  originalPurchaseDate: string | null;
}

export interface BillingPackageSummary {
  identifier: string;
  normalizedIdentifier: BillingPackageId | null;
  productIdentifier: string;
  title: string;
  description: string;
  priceLabel: string;
  packageRef: any;
}

export const initializeBilling = (appUserId: string): any => {
  initializedUserId = appUserId;
  return { appUserId };
};

export const getBillingInstance = (): any | null => {
  if (!initializedUserId) return null;
  return { appUserId: initializedUserId };
};

export const getOfferings = async (): Promise<any | null> => {
  return {
    current: {
      availablePackages: PRO_BILLING_PACKAGES.map((pkg) => ({
        identifier: pkg.packageId,
      })),
    },
    all: {},
  };
};

export const getCurrentBillingPackages = async (): Promise<BillingPackageSummary[]> => {
  return PRO_BILLING_PACKAGES.map((pkg) => ({
    identifier: pkg.packageId,
    normalizedIdentifier: pkg.packageId,
    productIdentifier: pkg.packageId,
    title: pkg.name,
    description: pkg.description,
    priceLabel: pkg.fallbackPriceLabel,
    packageRef: { identifier: pkg.packageId },
  }));
};

export const getBillingCustomerInfo = async (): Promise<BillingCustomerInfo | null> => {
  return null;
};

export const checkEntitlementStatus = async (): Promise<boolean> => {
  return false;
};

export const getCurrentProductPlan = async (): Promise<string | null> => {
  return null;
};

export const purchaseBillingPackage = async (
  packageIdentifier: string
): Promise<{
  success: boolean;
  customerInfo?: BillingCustomerInfo | null;
  packageIdentifier?: string;
  productIdentifier?: string;
  purchaseResult?: any;
  error?: string;
}> => {
  try {
    const normalized = normalizeProPackageId(packageIdentifier) || "monthly";
    const resp = await fetch("/api/v1/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_name: packageIdentifier.toUpperCase() }),
    });
    if (!resp.ok) throw new Error("Native upgrade failed");
    return { success: true, packageIdentifier: normalized, productIdentifier: normalized };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to initialize checkout" };
  }
};

export const presentBillingPaywall = async (): Promise<{ success: boolean; result?: any; error?: string }> => {
  return {
    success: false,
    error: "Use Lemon Squeezy hosted checkout for billing",
  };
};

export const restoreBillingPurchases = async (): Promise<{
  success: boolean;
  hasActiveSubscription: boolean;
  customerInfo?: BillingCustomerInfo | null;
  error?: string;
}> => {
  return {
    success: true,
    hasActiveSubscription: false,
    customerInfo: null,
  };
};

export const logOutBilling = async (): Promise<void> => {
  initializedUserId = null;
};

export const normalizeBillingPackageIdentifier = normalizeProPackageId;
