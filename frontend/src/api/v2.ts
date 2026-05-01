import { apiClient } from './client';

export interface Wallet {
    id: string;
    account_id: string;
    type: 'INTERNAL_FIAT' | 'ONCHAIN_STABLE';
    currency: 'USD' | 'KES' | 'USDC';
    balance: number;
    chain_address?: string;
}

export interface Transaction {
    id: string;
    sender_wallet_id: string;
    recipient_wallet_id: string;
    amount: number;
    currency: string;
    status: string;
    message?: string;
    created_at: string;
}

export const apiV2 = {
    // Accounts
    createAccount: async (email: string, name: string, type: 'PERSONAL' | 'BUSINESS') => {
        const { data } = await apiClient.post('/api/accounts', { email, name, type });
        return data;
    },

    // Wallets
    getWallets: async (accountId: string) => {
        const { data } = await apiClient.get<Wallet[]>(`/api/wallets?account_id=${accountId}`);
        return data;
    },

    // Social
    createPayment: async (fromWalletId: string, toWalletId: string, amount: number, message: string) => {
        const { data } = await apiClient.post('/api/social/pay', {
            from_wallet: fromWalletId,
            to_wallet: toWalletId,
            amount: Number(amount),
            message
        });
        return data;
    },

    getFeed: async () => {
        const { data } = await apiClient.get<Transaction[]>('/api/social/feed');
        return data;
    },

    // Workflows
    executeWorkflow: async (templateId: string, accountId: string, input: any) => {
        const { data } = await apiClient.post('/api/workflows/execute', {
            template_id: templateId,
            account_id: accountId,
            input
        });
        return data;
    }
};
