export type CanonicalPlan = {
  slug: "free" | "pro" | "premium" | "enterprise";
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  marketingPoints: string[];
  limits: Record<string, number | boolean>;
  cta: string;
  popular?: boolean;
};

export type ProBillingPackage = {
  packageId: "monthly" | "yearly" | "lifetime";
  name: string;
  fallbackPriceLabel: string;
  intervalLabel: string;
  description: string;
};

export const PRO_BILLING_PACKAGES: ProBillingPackage[] = [
  {
    packageId: "monthly",
    name: "Monthly",
    fallbackPriceLabel: "$29",
    intervalLabel: "month",
    description: "Flexible monthly access to Payday Pro.",
  },
  {
    packageId: "yearly",
    name: "Yearly",
    fallbackPriceLabel: "$290",
    intervalLabel: "year",
    description: "Best annual value for teams using Payday Pro all year.",
  },
  {
    packageId: "lifetime",
    name: "Lifetime",
    fallbackPriceLabel: "$799",
    intervalLabel: "lifetime",
    description: "One-time purchase for perpetual Payday Pro access.",
  },
];

export const PRO_PACKAGE_ALIASES: Record<ProBillingPackage["packageId"], string[]> = {
  monthly: ["monthly", "$rc_monthly", "corridor_monthly"],
  yearly: ["yearly", "annual", "$rc_annual", "corridor_yearly"],
  lifetime: ["lifetime", "$rc_lifetime", "corridor_lifetime"],
};

export const normalizeProPackageId = (
  packageIdentifier: string | null | undefined
): ProBillingPackage["packageId"] | null => {
  const normalized = (packageIdentifier || "").toLowerCase().trim();
  if (!normalized) return null;

  const entries = Object.entries(PRO_PACKAGE_ALIASES) as Array<
    [ProBillingPackage["packageId"], string[]]
  >;
  for (const [canonicalId, aliases] of entries) {
    if (aliases.includes(normalized)) {
      return canonicalId;
    }
  }
  return null;
};

export const getProBillingPackage = (
  packageIdentifier: string | null | undefined
): ProBillingPackage | null => {
  const normalized = normalizeProPackageId(packageIdentifier);
  if (!normalized) return null;
  return PRO_BILLING_PACKAGES.find((pkg) => pkg.packageId === normalized) || null;
};

export const CANONICAL_PRICING_CATALOG: CanonicalPlan[] = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    description: "Starter tier for individuals and small teams launching with core wallets and social payments.",
    features: [
      "1 managed wallet",
      "Payments and social goals",
      "Community support",
    ],
    marketingPoints: [
      "1 managed wallet",
      "Core payments and social goals",
      "Community support",
    ],
    limits: {
      wallet_limit: 1,
      api_access: false,
      webhooks: false,
      payouts: false,
      ewa: false,
      treasury: false,
      payout_fee_rate: 0.015,
    },
    cta: "Start Free",
  },
  {
    slug: "pro",
    name: "Payday Pro",
    monthlyPrice: "$29",
    yearlyPrice: "$290",
    description: "Automation, payouts, API access, and webhooks for growing teams running production payment flows.",
    features: [
      "Up to 3 wallets",
      "Payouts and EWA",
      "API keys and webhooks",
      "Lemon Squeezy billing options: monthly, yearly, lifetime",
    ],
    marketingPoints: [
      "API and webhook access",
      "Payouts and EWA",
      "Priority support",
    ],
    limits: {
      wallet_limit: 3,
      api_access: true,
      webhooks: true,
      payouts: true,
      ewa: true,
      treasury: false,
      payout_fee_rate: 0.01,
    },
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    slug: "premium",
    name: "Premium",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    description: "Advanced treasury controls and higher-scale operations for teams with complex payout flows.",
    features: [
      "Unlimited wallets",
      "Treasury automation",
      "Advanced controls",
    ],
    marketingPoints: [
      "Unlimited wallets",
      "Treasury automation",
      "Advanced controls",
    ],
    limits: {
      wallet_limit: -1,
      api_access: true,
      webhooks: true,
      payouts: true,
      ewa: true,
      treasury: true,
      payout_fee_rate: 0.005,
    },
    cta: "Choose Premium",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    monthlyPrice: "$299",
    yearlyPrice: "$2990",
    description: "Dedicated support, custom SLA, and high-volume optimization for platform and enterprise rollouts.",
    features: [
      "Dedicated support",
      "Custom SLA and integrations",
      "High-volume optimization",
    ],
    marketingPoints: [
      "Dedicated support",
      "Custom SLA",
      "High-volume optimization",
    ],
    limits: {
      wallet_limit: -1,
      api_access: true,
      webhooks: true,
      payouts: true,
      ewa: true,
      treasury: true,
      payout_fee_rate: 0.005,
    },
    cta: "Contact Sales",
  },
];
