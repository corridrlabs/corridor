import type { User } from "../api/client";

export const hasCompletedWalletSetup = (user: User | null | undefined): boolean => {
  if (!user) return false;

  const directWallet = String((user as any)?.wallet_address || '').trim();
  if (directWallet) return true;

  const onboardingWallet = (user as any)?.onboarding_data?.wallet_setup || {};
  return Boolean(
    String(onboardingWallet?.address || '').trim() ||
    String(onboardingWallet?.provider || '').trim() ||
    String(onboardingWallet?.phone || '').trim()
  );
};

export const needsWalletSetup = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return user.onboarding_completed === true && !hasCompletedWalletSetup(user);
};
