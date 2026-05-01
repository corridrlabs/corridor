import { CanonicalPlan } from '../config/pricingCatalog';

export type BillingCycle = 'monthly' | 'yearly';

export const getPlanPrice = (plan: CanonicalPlan, cycle: BillingCycle): string => {
  return cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
};

export const getPlanPeriodLabel = (cycle: BillingCycle): string => {
  return cycle === 'yearly' ? '/year' : '/month';
};

