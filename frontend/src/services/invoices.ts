import api from './api';

export interface Invoice {
    id: string;
    invoice_number: string;
    client: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'draft';
    due_date: string;
    issue_date: string;
    items: any[];
}

export const invoicesService = {
    getAll: async (status?: string) => {
        const response = await api.get<Invoice[]>('/invoices', { params: { status } });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Invoice>(`/invoices/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<Invoice>('/invoices', data);
        return response.data;
    },

    send: async (id: string, method: 'email' | 'sms' = 'email') => {
        const response = await api.post(`/invoices/${id}/send`, null, { params: { method } });
        return response.data;
    },

    download: async (id: string) => {
        const response = await api.get(`/invoices/${id}/download`);
        return response.data;
    }
};
