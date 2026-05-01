import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface UsageData {
  monthly_transactions: number
  api_calls: number
  team_members: number
}

export const useTierLimit = () => {
  const { tierLimits, user } = useAuth()
  const [usage, setUsage] = useState<UsageData>({
    monthly_transactions: 0,
    api_calls: 0,
    team_members: 1
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await api.get('/billing/usage')
        setUsage(response.data)
      } catch (error) {
        console.error('Failed to fetch usage:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUsage()
    }
  }, [user])

  const getUsagePercentage = (metric: keyof UsageData): number => {
    if (!tierLimits) return 0
    
    const limit = tierLimits[metric]
    const current = usage[metric]
    
    if (limit === -1) return 0 // unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const isNearLimit = (metric: keyof UsageData, threshold = 80): boolean => {
    return getUsagePercentage(metric) >= threshold
  }

  const isAtLimit = (metric: keyof UsageData): boolean => {
    if (!tierLimits) return false
    
    const limit = tierLimits[metric]
    const current = usage[metric]
    
    return limit !== -1 && current >= limit
  }

  const getRemainingUsage = (metric: keyof UsageData): number => {
    if (!tierLimits) return 0
    
    const limit = tierLimits[metric]
    const current = usage[metric]
    
    if (limit === -1) return Infinity
    return Math.max(0, limit - current)
  }

  return {
    usage,
    tierLimits,
    loading,
    getUsagePercentage,
    isNearLimit,
    isAtLimit,
    getRemainingUsage,
    currentTier: user?.tier || 'free'
  }
}
