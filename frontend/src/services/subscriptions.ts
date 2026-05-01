import api from './api';

export interface Subscription {
    id: string;
    plan_name: string;
    customer: string;
    amount: number;
    interval: string;
    status: 'active' | 'paused' | 'cancelled';
    next_billing: string;
    start_date: string;
}

export const subscriptionsService = {
    getAll: async () => {
        const response = await api.get<Subscription[]>('/subscriptions');
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<Subscription>('/subscriptions', data);
        return response.data;
    },

    pause: async (id: string) => {
        const response = await api.post(`/subscriptions/${id}/pause`);
        return response.data;
    },

    resume: async (id: string) => {
        const response = await api.post(`/subscriptions/${id}/resume`);
        return response.data;
    },

    cancel: async (id: string) => {
        const response = await api.delete(`/subscriptions/${id}`);
        return response.data;
    }
};
