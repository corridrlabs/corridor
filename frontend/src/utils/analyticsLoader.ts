/**
 * Analytics Loader
 * 
 * Loads analytics scripts based on user consent.
 * 
 * Usage:
 * import { loadAnalytics } from '../utils/analyticsLoader';
 * useEffect(() => { loadAnalytics(); }, []);
 */

const ANALYTICS_SCRIPT_URLS = {
  posthog: 'https://cdn.jsdelivr.net/npm/posthog-js@2/dist/posthog.min.js',
};

export const loadAnalytics = (): void => {
  try {
    const consent = (window as any).cookieConsent;
    
    if (!consent?.hasConsented || !consent?.analytics) {
      console.log('[Analytics] Not loaded: consent not given or analytics not enabled');
      return;
    }

    // PostHog example - replace with your actual API key
    if (typeof window !== 'undefined' && !(window as any).posthog) {
      const script = document.createElement('script');
      script.src = ANALYTICS_SCRIPT_URLS.posthog;
      script.async = true;
      script.onload = () => {
        (window as any).posthog?.init('YOUR_POSTHOG_API_KEY', {
          api_host: 'https://app.posthog.com',
          autocapture: false,
          capture_pageview: true,
        });
        console.log('[Analytics] PostHog loaded');
      };
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error('[Analytics] Failed to load:', error);
  }
};

export const loadMarketing = (): void => {
  console.log('[Marketing] Load function - implement with your pixel IDs');
};

export const initializeTracking = (): void => {
  loadAnalytics();
  loadMarketing();
};

export interface ConsentStatus {
  analytics: boolean;
  marketing: boolean;
  hasConsented: boolean;
}

export const getConsentStatus = (): ConsentStatus => {
  const consent = (window as any).cookieConsent;
  
  if (!consent?.hasConsented) {
    return { analytics: false, marketing: false, hasConsented: false };
  }
  
  return {
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    hasConsented: true,
  };
};