import api from './api';

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    type: 'credit' | 'debit';
    method: string;
    reference?: string;
}

export interface TransactionStats {
    total_credit: number;
    total_debit: number;
    net: number;
    count: number;
}

export const transactionsService = {
    getAll: async (params?: { status?: string; type?: string; method?: string; limit?: number }) => {
        const response = await api.get<Transaction[]>('/transactions', { params });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get<TransactionStats>('/transactions/stats');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Transaction>(`/transactions/${id}`);
        return response.data;
    },

    export: async (format: 'csv' | 'json' = 'csv') => {
        const response = await api.post('/transactions/export', null, { params: { format } });
        return response.data;
    }
};
