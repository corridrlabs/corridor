import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useTierLimit } from '../hooks/useTierLimit'

interface NavItem {
  path: string
  label: string
  feature?: string
  icon?: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/wallet/deposit', label: 'Wallet', icon: '💳' },
  { path: '/finance', label: 'Payments', icon: '💸' },
  { path: '/ewa/admin', label: 'EWA', feature: 'ewa', icon: '⚡' },
  { path: '/social/goals', label: 'Social', feature: 'social_payments', icon: '👥' },
  { path: '/developers', label: 'API', feature: 'api_access', icon: '🔧' },
  { path: '/analytics', label: 'Analytics', feature: 'advanced_analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
]

export const Navigation: React.FC = () => {
  const location = useLocation()
  const { checkAccess, currentTier } = useFeatureAccess()
  const { usage, tierLimits, getUsagePercentage } = useTierLimit()

  const getUsageBadge = (item: NavItem): string | undefined => {
    if (item.path === '/social/goals' && tierLimits) {
      const percentage = getUsagePercentage('monthly_transactions')
      if (percentage > 80) return `${Math.round(percentage)}%`
    }
    return undefined
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname.startsWith(item.path)
    const access = item.feature ? checkAccess(item.feature) : { hasAccess: true }
    const badge = getUsageBadge(item)

    if (!access.hasAccess) {
      return (
        <div
          key={item.path}
          className="flex items-center justify-between px-3 py-2 text-gray-400 cursor-not-allowed"
        >
          <div className="flex items-center space-x-3">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Upgrade
            </span>
          </div>
        </div>
      )
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded ${
            badge.includes('%') && parseInt(badge) > 90
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map(renderNavItem)}
      
      {currentTier === 'free' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-2">Upgrade to Pro</h3>
          <p className="text-sm text-gray-600 mb-3">
            Unlock EWA, social payments, and API access
          </p>
          <Link
            to="/pricing"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}
    </nav>
  )
}