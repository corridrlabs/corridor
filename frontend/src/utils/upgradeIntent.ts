import type { User } from "../api/client";

const UPGRADE_INTENT_KEY = "corridor_pending_upgrade_plan";

export const isPaidPlanSlug = (planSlug?: string | null): boolean => {
  const slug = String(planSlug || "").trim().toLowerCase();
  return slug === "pro" || slug === "premium" || slug === "enterprise";
};

export const savePendingUpgradePlan = (planSlug?: string | null): void => {
  const slug = String(planSlug || "").trim().toLowerCase();
  if (!isPaidPlanSlug(slug)) {
    localStorage.removeItem(UPGRADE_INTENT_KEY);
    return;
  }
  localStorage.setItem(UPGRADE_INTENT_KEY, slug);
};

export const getPendingUpgradePlan = (): string | null => {
  const slug = localStorage.getItem(UPGRADE_INTENT_KEY);
  return isPaidPlanSlug(slug) ? String(slug).toLowerCase() : null;
};

export const clearPendingUpgradePlan = (): void => {
  localStorage.removeItem(UPGRADE_INTENT_KEY);
};

export const hasActiveTierForPlan = (user: User | null | undefined, planSlug: string): boolean => {
  if (!user) return false;
  const requested = String(planSlug || "").trim().toLowerCase();
  const tier = String((user as any)?.user_tier || user?.tier || "FREE").trim().toLowerCase();
  const status = String((user as any)?.subscription_status || "active").trim().toLowerCase();

  if (["inactive", "cancelled", "expired"].includes(status) && tier !== "free") {
    return false;
  }

  const rank: Record<string, number> = {
    free: 0,
    pro: 1,
    premium: 2,
    enterprise: 3,
  };
  return (rank[tier] ?? 0) >= (rank[requested] ?? 0);
};
