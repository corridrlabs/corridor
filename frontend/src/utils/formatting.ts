// Currency formatting
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  const currencyMap: Record<string, { symbol: string; decimals: number }> = {
    USD: { symbol: '$', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
    KES: { symbol: 'KSh', decimals: 2 },
    USDC: { symbol: 'USDC', decimals: 6 },
    SOL: { symbol: 'SOL', decimals: 9 },
    BTC: { symbol: '₿', decimals: 8 },
    ETH: { symbol: 'Ξ', decimals: 18 }
  }

  const config = currencyMap[currency] || { symbol: currency, decimals: 2 }
  
  // For crypto, show fewer decimals for display
  const displayDecimals = ['USDC', 'SOL', 'BTC', 'ETH'].includes(currency) ? 4 : config.decimals

  try {
    const isStandardCurrency = ['USD', 'EUR', 'GBP'].includes(currency);
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: displayDecimals,
      maximumFractionDigits: displayDecimals,
    };

    if (isStandardCurrency) {
      options.style = 'currency';
      options.currency = currency;
    } else {
      options.style = 'decimal';
    }

    const formatted = new Intl.NumberFormat(locale, options).format(amount);
    return isStandardCurrency ? formatted : `${config.symbol} ${formatted}`;
  } catch (err) {
    // Fallback for any other issues
    console.error('Formatting error:', err);
    return `${config.symbol} ${amount.toFixed(displayDecimals)}`;
  }
}

// Date/time formatting
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'relative' = 'short',
  locale = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    return formatRelativeTime(dateObj)
  }

  const options: Intl.DateTimeFormatOptions = format === 'long'
    ? { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    : { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }

  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

export const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date, 'short')
}

// Number abbreviation
export const formatNumber = (
  num: number,
  precision = 1
): string => {
  const units = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ]

  for (const unit of units) {
    if (Math.abs(num) >= unit.value) {
      const abbreviated = num / unit.value
      return `${abbreviated.toFixed(precision)}${unit.symbol}`
    }
  }

  return num.toString()
}

// Percentage calculations
export const formatPercentage = (
  value: number,
  total: number,
  decimals = 1
): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

export const calculatePercentageChange = (
  current: number,
  previous: number
): { value: number; formatted: string; isPositive: boolean } => {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      formatted: current > 0 ? '+100%' : '0%',
      isPositive: current > 0
    }
  }

  const change = ((current - previous) / previous) * 100
  const isPositive = change >= 0

  return {
    value: Math.abs(change),
    formatted: `${isPositive ? '+' : '-'}${Math.abs(change).toFixed(1)}%`,
    isPositive
  }
}

// Utility for formatting file sizes
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Phone number formatting
export const formatPhoneNumber = (phone: string, country = 'US'): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (country === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (country === 'KE' && cleaned.length === 9) {
    return `+254 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  return phone
}