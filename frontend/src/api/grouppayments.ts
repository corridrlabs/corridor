import { apiClient } from './client';

export interface GroupPaymentInput {
    senders: Array<{
        wallet_id: string;
        amount?: number; // For custom splits
    }>;
    recipients: Array<{
        wallet_id: string;
        amount?: number; // For custom splits
    }>;
    total_amount: number;
    currency: string;
    message: string;
    split_type: 'equal_split' | 'custom_split';
}

export interface TransactionSplit {
    id: string;
    transaction_id: string;
    wallet_id: string;
    amount: number;
    status: string;
    direction: 'sender' | 'recipient';
    created_at: string;
    completed_at?: string;
}

export const groupPaymentsApi = {
    /**
     * Create a group payment (many-to-many)
     */
    createGroupPayment: async (input: GroupPaymentInput) => {
        const response = await apiClient.post('/api/social/group-pay', input);
        return response.data;
    },

    /**
     * Get split details for a transaction
     */
    getTransactionSplits: async (transactionId: string): Promise<TransactionSplit[]> => {
        const response = await apiClient.get(`/api/transactions/${transactionId}/splits`);
        return response.data;
    },
};
