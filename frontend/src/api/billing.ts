import { apiClient } from './client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  description?: string;
  features: string[];
  marketing_points?: string[];
  product_mapping?: Record<string, string>;
  limits: {
    [key: string]: number | boolean | string;
  };
}

export interface UsageStats {
  customers_count: number;
  transactions_count: number;
  api_requests: number;
  storage_mb: number;
}

export interface UpgradePayload {
  plan_slug?: string;
  package_id?: string;
  entitlement?: string;
  callback_url?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  checkout_id?: string;
  variant_id?: string;
  plan_slug: string;
  package_id: string;
  provider: 'lemon_squeezy' | 'internal';
}

export interface CustomerPortalResponse {
  portal_url: string;
  provider: 'lemon_squeezy';
}

export interface BillingFeeSchedule {
  currency: string;
  ewa_withdrawal_flat_fee: number;
  ewa_withdrawal_unit: string;
  social_contribution_fee_rate: number;
  payout_fee_rates: {
    free: number;
    pro: number;
    premium: number;
    enterprise: number;
  };
}

export const billingApi = {
  /**
   * Get all available subscription plans
   */
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/api/billing/plans');
    return response.data;
  },

  /**
   * Get usage statistics for current account
   */
  getUsage: async (): Promise<UsageStats> => {
    const response = await apiClient.get('/api/account/usage');
    return response.data;
  },

  notifyUpgrade: async (payload: UpgradePayload) => {
    const response = await apiClient.post('/api/billing/upgrade', payload);
    return response.data;
  },

  createCheckout: async (payload: UpgradePayload): Promise<CheckoutResponse> => {
    const response = await apiClient.post('/api/billing/upgrade', payload);
    return response.data;
  },

  verifyCheckout: async (reference: string, plan_slug?: string) => {
    const response = await apiClient.post('/api/billing/verify', { reference, plan_slug });
    return response.data as { provider: string; user_tier: string; subscription_status: string };
  },

  getCustomerPortal: async (): Promise<CustomerPortalResponse> => {
    const response = await apiClient.get('/api/billing/customer-portal');
    return response.data;
  },

  getFees: async (): Promise<BillingFeeSchedule> => {
    const response = await apiClient.get('/api/billing/fees');
    return response.data;
  },

  /**
   * Legacy method for compatibility
   */
  getBillingData: async (organizationId?: string) => {
    const plans = await billingApi.getPlans();
    const usage = await billingApi.getUsage();

    return {
      plan: plans.find(p => p.slug === 'free') || plans[0],
      usage: {
        executions: usage.transactions_count,
        users: usage.customers_count,
      },
      invoices: [],
    };
  },
};
