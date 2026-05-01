import { apiClient } from '../api/client';

export type PaymentRail = 'paystack_card' | 'mpesa' | 'circle_usdc' | 'solana_native';

export interface DepositRequest {
  amount: number;
  currency: string;
  rail: PaymentRail;
  metadata?: Record<string, any>;
}

export interface WithdrawRequest {
  amount: number;
  currency: string;
  rail: PaymentRail;
  destination: string;
}

export interface PaymentRailInfo {
  id: PaymentRail;
  name: string;
  description: string;
  currencies: string[];
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  icon: string;
}

export const PAYMENT_RAILS: PaymentRailInfo[] = [
  {
    id: 'paystack_card',
    name: 'Card Payment',
    description: 'Visa, Mastercard via Paystack',
    currencies: ['KES', 'USD'],
    depositEnabled: true,
    withdrawEnabled: true,
    icon: '💳'
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Mobile money payments',
    currencies: ['KES'],
    depositEnabled: true,
    withdrawEnabled: false,
    icon: '📱'
  },
  {
    id: 'circle_usdc',
    name: 'USDC',
    description: 'USD Coin stablecoin',
    currencies: ['USDC'],
    depositEnabled: true,
    withdrawEnabled: true,
    icon: '🪙'
  },
  {
    id: 'solana_native',
    name: 'Solana',
    description: 'SOL cryptocurrency',
    currencies: ['SOL'],
    depositEnabled: true,
    withdrawEnabled: true,
    icon: '◎'
  }
];

class PaymentRailsService {
  async initiateDeposit(request: DepositRequest): Promise<{ reference: string }> {
    const response = await apiClient.post('/deposits', request);
    return response.data;
  }

  async initiateWithdraw(request: WithdrawRequest): Promise<{ status: string }> {
    const response = await apiClient.post('/withdrawals', request);
    return response.data;
  }

  async getAvailableRails(type: 'deposit' | 'withdraw'): Promise<PaymentRailInfo[]> {
    return PAYMENT_RAILS.filter(rail =>
      type === 'deposit' ? rail.depositEnabled : rail.withdrawEnabled
    );
  }

  async getRailInfo(railId: PaymentRail): Promise<PaymentRailInfo | undefined> {
    return PAYMENT_RAILS.find(rail => rail.id === railId);
  }

  // Handle Paystack redirect flow
  async handlePaystackCallback(reference: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/deposits/paystack/verify/${reference}`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Get deposit address for crypto rails
  async getDepositAddress(rail: PaymentRail): Promise<string> {
    const response = await apiClient.get(`/deposits/${rail}/address`);
    return response.data.address;
  }
}

export const paymentRailsService = new PaymentRailsService();