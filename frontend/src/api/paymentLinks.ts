import { apiClient } from './client';
const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data) as T

export interface PaymentLink {
    id: string;
    title: string;
    slug: string;
    amount: number;
    currency: string;
    views: number;
    payments_count: number;
    is_active: boolean;
    created_at: string;
}

export interface PaymentLinkTransaction {
    id: string;
    payment_link_id: string;
    payer_email?: string;
    payer_name?: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    transaction_id?: string;
    created_at: string;
    completed_at?: string;
}

export const paymentLinksApi = {
    create: async (data: { title: string; amount: number; currency: string }) => {
        const response = await apiClient.post<PaymentLink>('/api/payment-links', data);
        return unwrap<PaymentLink>(response);
    },

    list: async () => {
        const response = await apiClient.get<PaymentLink[]>('/api/payment-links');
        return unwrap<PaymentLink[]>(response);
    },

    resolve: async (slug: string) => {
        const response = await apiClient.get<PaymentLink>(`/api/payment-links/resolve?slug=${slug}`);
        return unwrap<PaymentLink>(response);
    },

    pay: async (data: { 
        slug: string; 
        payment_method: string; 
        payer_email?: string; 
        payer_name?: string;
        phone?: string;
    }) => {
        const response = await apiClient.post<any>('/api/payment-links/pay', data);
        return unwrap<any>(response);
    },

    checkStatus: async (transactionId: string) => {
        const response = await apiClient.get<any>(`/api/payment-links/status?transaction_id=${transactionId}`);
        return unwrap<any>(response);
    }
};
