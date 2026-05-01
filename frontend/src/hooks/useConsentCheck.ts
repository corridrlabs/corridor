/**
 * Cookie Consent Hook
 * 
 * Usage:
 * const { consent, canUseAnalytics, canUseMarketing, updateConsent } = useCookieConsent();
 * 
 * // Check before loading analytics
 * if (canUseAnalytics) {
 *   loadAnalyticsScript();
 * }
 */

import { useCookieConsent, CookieConsentProvider } from '../components/CookieConsent';
import { useState, useEffect } from 'react';

// Also export the provider for wrapping the app
export { CookieConsentProvider };

// Re-export the hook with additional helpers
export const useConsentCheck = () => {
  const context = useCookieConsent();
  
  const canUseAnalytics = context.consent.hasConsented && context.consent.analytics;
  const canUseMarketing = context.consent.hasConsented && context.consent.marketing;
  const canUseEssential = context.consent.hasConsented && context.consent.essential;
  
  return {
    ...context,
    canUseAnalytics,
    canUseMarketing,
    canUseEssential,
    // Helper to check any category
    canUse: (category: 'essential' | 'analytics' | 'marketing') => {
      return context.consent.hasConsented && context.consent[category];
    },
  };
};

export default useConsentCheck;