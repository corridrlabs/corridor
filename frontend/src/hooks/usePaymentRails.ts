import { useState, useCallback } from 'react'
import api from '../services/api'

export type PaymentRail = 'card' | 'crypto' | 'bank_transfer' | 'mobile_money'

interface PaymentRailConfig {
  id: PaymentRail
  name: string
  fees: number
  processingTime: string
  currencies: string[]
  available: boolean
}

const PAYMENT_RAILS: PaymentRailConfig[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    fees: 2.9,
    processingTime: 'Instant',
    currencies: ['USD', 'EUR', 'GBP'],
    available: true
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    fees: 1.0,
    processingTime: '5-10 minutes',
    currencies: ['USDC', 'SOL', 'BTC', 'ETH'],
    available: true
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    fees: 0.5,
    processingTime: '1-3 business days',
    currencies: ['USD', 'EUR', 'GBP', 'KES'],
    available: true
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    fees: 1.5,
    processingTime: 'Instant',
    currencies: ['KES', 'UGX', 'TZS'],
    available: true
  }
]

export const usePaymentRails = () => {
  const [loading, setLoading] = useState(false)

  const getAvailableRails = useCallback((currency?: string): PaymentRailConfig[] => {
    return PAYMENT_RAILS.filter(rail =>
      rail.available && (!currency || rail.currencies.includes(currency))
    )
  }, [])

  const getBestRail = useCallback((
    amount: number,
    currency: string,
    priority: 'speed' | 'cost' = 'speed'
  ): PaymentRailConfig | null => {
    const availableRails = getAvailableRails(currency)

    if (availableRails.length === 0) return null

    if (priority === 'cost') {
      return availableRails.reduce((best, current) =>
        current.fees < best.fees ? current : best
      )
    }

    // Priority is speed - prefer instant methods
    const instantRails = availableRails.filter(rail =>
      rail.processingTime === 'Instant'
    )

    return instantRails.length > 0 ? instantRails[0] : availableRails[0]
  }, [getAvailableRails])

  const processPayment = useCallback(async (
    rail: PaymentRail,
    amount: number,
    currency: string,
    recipient?: string
  ) => {
    setLoading(true)
    try {
      const response = await api.post('/payment-links', {
        title: `Payment via ${rail}`,
        amount,
        currency,
        customer_email: recipient || undefined,
      })
      return response.data
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateFees = useCallback((
    rail: PaymentRail,
    amount: number
  ): number => {
    const railConfig = PAYMENT_RAILS.find(r => r.id === rail)
    if (!railConfig) return 0

    return (amount * railConfig.fees) / 100
  }, [])

  return {
    availableRails: PAYMENT_RAILS,
    getAvailableRails,
    getBestRail,
    processPayment,
    calculateFees,
    loading
  }
}
