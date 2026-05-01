import React, { useState, useEffect, createContext, useContext } from 'react';
import { Shield, X, Check, Cookie, ChevronRight, Settings, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

type CookieCategory = 'essential' | 'analytics' | 'marketing';

interface CookieConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  hasConsented: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsentState;
  updateConsent: (categories: Partial<CookieConsentState>) => void;
  showPreferences: () => void;
  isConsentGiven: () => boolean;
}

const CookieContext = createContext<CookieConsentContextType | null>(null);

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};

const COOKIE_KEY = 'corridor_consent_preferences';
const COOKIE_DAYS = 365;

// Cookie categories with descriptions
const COOKIE_INFO: Record<CookieCategory, { label: string; description: string; required: boolean }> = {
  essential: {
    label: 'Essential Cookies',
    description: 'Required for secure authentication and transaction integrity. Cannot be disabled.',
    required: true,
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how users interact with our platform to improve experience.',
    required: false,
  },
  marketing: {
    label: 'Marketing',
    description: 'Used to personalize content and measure campaign effectiveness.',
    required: false,
  },
};

const getConsentFromStorage = (): CookieConsentState => {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        essential: parsed.essential ?? true,
        analytics: parsed.analytics ?? false,
        marketing: parsed.marketing ?? false,
        hasConsented: parsed.hasConsented ?? false,
      };
    }
  } catch (e) {
    console.error('Failed to parse cookie consent:', e);
  }
  return { essential: true, analytics: false, marketing: false, hasConsented: false };
};

const saveConsentToStorage = (state: CookieConsentState) => {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(state));
  // Also save to cookie for API access
  document.cookie = `${COOKIE_KEY}=${btoa(JSON.stringify(state))};max-age=${COOKIE_DAYS * 24 * 60 * 60};path=/;samesite=strict`;
};

const CookiePreferencesModal: React.FC<{ onClose: () => void; onSave: (state: CookieConsentState) => void }> = ({ onClose, onSave }) => {
  const [preferences, setPreferences] = useState<CookieConsentState>(getConsentFromStorage());

  const handleToggle = (category: CookieCategory) => {
    if (category === 'essential') return; // Can't disable
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = () => {
    const updated = { ...preferences, hasConsented: true };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cookie Preferences</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your privacy settings</p>
          </div>
        </div>

        <div className="space-y-4">
          {(Object.keys(COOKIE_INFO) as CookieCategory[]).map((category) => (
            <div
              key={category}
              className={clsx(
                'p-4 rounded-xl border transition-all',
                preferences[category as keyof CookieConsentState]
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(category)}
                    disabled={COOKIE_INFO[category].required}
                    className={clsx(
                      'w-6 h-6 rounded-md flex items-center justify-center transition-all',
                      preferences[category as keyof CookieConsentState]
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-400',
                      COOKIE_INFO[category].required && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {preferences[category as keyof CookieConsentState] && <Check size={14} />}
                  </button>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{COOKIE_INFO[category].label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{COOKIE_INFO[category].description}</p>
                  </div>
                </div>
                {COOKIE_INFO[category].required && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Required</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const CookieBanner: React.FC<{ onManage: () => void; onAcceptAll: () => void; onDecline: () => void }> = ({ onManage, onAcceptAll, onDecline }) => {
  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[9998] animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-200/50 p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">We value your privacy</h3>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Cookie Policy</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Corridor uses secure cookies to protect your session. We also use optional cookies for analytics to improve your experience. 
          You can choose which cookies you want to accept.
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3">
          <button
            onClick={onAcceptAll}
            className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Accept All
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            Essential Only
          </button>
        </div>

        <button
          onClick={onManage}
          className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          <Settings size={14} />
          Customize Preferences
          <ChevronRight size={14} />
        </button>

        <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-3">
          By continuing, you agree to our{' '}
          <a href="/privacy" className="text-slate-500 underline hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<CookieConsentState>({
    essential: true,
    analytics: false,
    marketing: false,
    hasConsented: false,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = getConsentFromStorage();
    setConsent(stored);
    
    if (!stored.hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateConsent = (categories: Partial<CookieConsentState>) => {
    const updated = { ...consent, ...categories, hasConsented: true };
    setConsent(updated);
    saveConsentToStorage(updated);
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    updateConsent({ essential: true, analytics: true, marketing: true });
  };

  const handleDecline = () => {
    updateConsent({ essential: true, analytics: false, marketing: false });
  };

  const handleManage = () => {
    setShowPreferences(true);
  };

  const handlePreferencesClose = () => {
    setShowPreferences(false);
  };

  const handlePreferencesSave = (prefs: CookieConsentState) => {
    setConsent(prefs);
    saveConsentToStorage(prefs);
    setIsVisible(false);
  };

  const isConsentGiven = () => consent.hasConsented;

  // Dispatch consent to window for script access
  useEffect(() => {
    (window as any).cookieConsent = consent;
  }, [consent]);

  return (
    <CookieContext.Provider
      value={{
        consent,
        updateConsent,
        showPreferences: handleManage,
        isConsentGiven,
      }}
    >
      {children}
      {isVisible && (
        <CookieBanner
          onManage={handleManage}
          onAcceptAll={handleAcceptAll}
          onDecline={handleDecline}
        />
      )}
      {showPreferences && (
        <CookiePreferencesModal
          onClose={handlePreferencesClose}
          onSave={handlePreferencesSave}
        />
      )}
    </CookieContext.Provider>
  );
};

// Legacy export for backward compatibility
export const CookieConsent: React.FC = () => null;