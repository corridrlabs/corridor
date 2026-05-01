import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, TierLimits } from '../api/client'
import { useAuthStore } from '../store/authStore'

interface AuthContextType {
  user: User | null
  tierLimits: TierLimits | null
  featureAccess: Record<string, boolean>
  onboardingStatus: {
    completed: boolean
    currentStep: string
    completedSteps: string[]
  }
  dashboardPreferences: {
    layout: 'grid' | 'list'
    widgets: string[]
    theme: 'light' | 'dark'
  }
  hasFeatureAccess: (feature: string) => boolean
  updatePreferences: (prefs: Partial<AuthContextType['dashboardPreferences']>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    monthly_transactions: 10,
    api_calls: 100,
    team_members: 1,
    features: ['basic_payments', 'wallet']
  },
  pro: {
    monthly_transactions: 1000,
    api_calls: 10000,
    team_members: 10,
    features: ['basic_payments', 'wallet', 'ewa', 'social_payments', 'api_access']
  },
  enterprise: {
    monthly_transactions: -1, // unlimited
    api_calls: -1,
    team_members: -1,
    features: ['basic_payments', 'wallet', 'ewa', 'social_payments', 'api_access', 'advanced_analytics', 'custom_integrations']
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null)
  const [dashboardPreferences, setDashboardPreferences] = useState<{
    layout: 'grid' | 'list'
    widgets: string[]
    theme: 'light' | 'dark'
  }>({
    layout: 'grid',
    widgets: ['balance', 'recent_transactions', 'quick_actions'],
    theme: 'light'
  })

  useEffect(() => {
    if (user?.tier) {
      setTierLimits(DEFAULT_TIER_LIMITS[user.tier])
    }

    if (user?.preferences) {
      setDashboardPreferences(prev => ({
        ...prev,
        layout: (user.preferences?.dashboard_layout as 'grid' | 'list') || prev.layout,
        theme: 'light'
      }))
    }
  }, [user])

  const featureAccess = React.useMemo(() => {
    if (!tierLimits) return {}

    return (tierLimits.features || []).reduce((acc, feature) => {
      acc[feature] = true
      return acc
    }, {} as Record<string, boolean>)
  }, [tierLimits])

  const onboardingStatus = React.useMemo(() => ({
    completed: user?.onboarding_completed || false,
    currentStep: user?.onboarding_completed ? 'completed' : 'profile',
    completedSteps: user?.onboarding_completed ? ['profile', 'verification', 'setup'] : []
  }), [user])

  const hasFeatureAccess = (feature: string): boolean => {
    return featureAccess[feature] || false
  }

  const updatePreferences = (prefs: Partial<{
    layout: 'grid' | 'list'
    widgets: string[]
    theme: 'light' | 'dark'
  }>) => {
    setDashboardPreferences(prev => ({ ...prev, ...prefs }))
  }

  const value: AuthContextType = {
    user,
    tierLimits,
    featureAccess,
    onboardingStatus,
    dashboardPreferences,
    hasFeatureAccess,
    updatePreferences
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
