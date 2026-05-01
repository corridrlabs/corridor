import { useAuth } from '../contexts/AuthContext'

export const useFeatureAccess = () => {
  const { hasFeatureAccess, user, tierLimits } = useAuth()

  const checkAccess = (feature: string): { 
    hasAccess: boolean
    reason?: string
    upgradeRequired?: boolean 
  } => {
    const hasAccess = hasFeatureAccess(feature)
    
    if (!hasAccess) {
      return {
        hasAccess: false,
        reason: `This feature requires ${getRequiredTier(feature)} tier or higher`,
        upgradeRequired: true
      }
    }

    return { hasAccess: true }
  }

  const getRequiredTier = (feature: string): string => {
    if (['basic_payments', 'wallet'].includes(feature)) return 'Free'
    if (['ewa', 'social_payments', 'api_access'].includes(feature)) return 'Pro'
    return 'Enterprise'
  }

  const canAccessRoute = (route: string): boolean => {
    const routeFeatureMap: Record<string, string> = {
      '/ewa': 'ewa',
      '/social': 'social_payments',
      '/developers': 'api_access',
      '/analytics': 'advanced_analytics'
    }

    const feature = routeFeatureMap[route]
    return feature ? hasFeatureAccess(feature) : true
  }

  return {
    checkAccess,
    canAccessRoute,
    currentTier: user?.tier || 'free',
    tierLimits
  }
}