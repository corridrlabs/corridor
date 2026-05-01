import { User } from '../api/client';

export const hasAcceptedRequiredLegal = (user?: User | null) => {
  if (!user) return false;
  return Boolean(user.terms_accepted) && Boolean(user.privacy_accepted);
};

export const needsLegalAcceptance = (user?: User | null) => {
  if (!user) return false;
  return !hasAcceptedRequiredLegal(user);
};
