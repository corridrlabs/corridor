import { apiClient } from './client';
const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T

export interface PayoutRequest {
    amount: number;
    currency: string;
    destination_bank: string;
    account_number: string;
    account_name: string;
}

export interface Payout {
    id: string;
    wallet_id: string;
    amount: number;
    currency: string;
    destination_bank: string;
    account_number_last4: string;
    status: 'PENDING' | 'PROCESSED' | 'FAILED';
    created_at: string;
}

export const payoutsApi = {
    requestPayout: async (data: PayoutRequest) => {
        const response = await apiClient.post<Payout>('/api/payouts', data);
        return unwrap<Payout>(response);
    },

    getPayouts: async () => {
        const response = await apiClient.get<Payout[]>('/api/payouts');
        return unwrap<Payout[]>(response);
    }
};
