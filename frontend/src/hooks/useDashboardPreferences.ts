import { useEffect, useMemo, useState } from 'react';

export interface DashboardPreferences {
  layout: 'comfortable' | 'compact';
  showStats: boolean;
  showFinanceHub: boolean;
  showPeopleHub: boolean;
  showAutomationHub: boolean;
  showActivity: boolean;
  showSidebar: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  layout: 'comfortable',
  showStats: true,
  showFinanceHub: true,
  showPeopleHub: true,
  showAutomationHub: true,
  showActivity: true,
  showSidebar: true,
};

const getStorageKey = (userId?: string) => `corridor-dashboard-preferences:${userId || 'default'}`;

export const getDashboardPreferences = (userId?: string): DashboardPreferences => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const useDashboardPreferences = (userId?: string) => {
  const storageKey = useMemo(() => getStorageKey(userId), [userId]);
  const [preferences, setPreferences] = useState<DashboardPreferences>(() =>
    getDashboardPreferences(userId)
  );

  useEffect(() => {
    setPreferences(getDashboardPreferences(userId));
  }, [userId, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    window.dispatchEvent(
      new CustomEvent('dashboard-preferences-updated', {
        detail: { storageKey, preferences },
      })
    );
  }, [preferences, storageKey]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(event.newValue) });
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    };

    const onCustomUpdate = (event: Event) => {
      const custom = event as CustomEvent<{ storageKey: string; preferences: DashboardPreferences }>;
      if (custom.detail?.storageKey === storageKey) {
        setPreferences(custom.detail.preferences);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('dashboard-preferences-updated', onCustomUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('dashboard-preferences-updated', onCustomUpdate as EventListener);
    };
  }, [storageKey]);

  const updatePreference = <K extends keyof DashboardPreferences>(
    key: K,
    value: DashboardPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
};

