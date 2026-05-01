import { User } from '../api/client';
import { needsLegalAcceptance } from './legalConsent';
import { needsWalletSetup } from './walletSetup';

export const getPostAuthRoute = (user?: User | null) => {
  if (!user) return '/login';
  if (user.onboarding_completed === false) return '/onboarding';
  if (needsLegalAcceptance(user)) return '/legal?accept=1';

  const fullName = String((user as any)?.full_name || (user as any)?.name || '').trim();
  const phone = String((user as any)?.whatsapp_phone || (user as any)?.phone || '').trim();
  const profileCompleted = fullName.length > 1 && phone.length > 0;
  const kycStatus = String((user as any)?.kyc_status || '').toUpperCase();
  const kycCompleted = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(kycStatus);

  if (!profileCompleted || !kycCompleted) {
    return `/settings?required=1&tab=${!profileCompleted ? 'profile' : 'kyc'}`;
  }

  if (needsWalletSetup(user)) return '/wallet-setup';
  return '/dashboard';
};
