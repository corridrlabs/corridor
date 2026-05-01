import api from './api';

export interface Connector {
    id: string;
    name: string;
    provider: string;
    status: 'connected' | 'disconnected' | 'pending';
    config?: any;
    created_at: string;
    updated_at: string;
}

export const connectorsService = {
    getAll: async () => {
        const response = await api.get<Connector[]>('/connectors');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Connector>(`/connectors/${id}`);
        return response.data;
    },

    create: async (data: { provider: string; config: any }) => {
        const response = await api.post<Connector>('/connectors', data);
        return response.data;
    },

    update: async (id: string, data: { status?: string; config?: any }) => {
        const response = await api.put<Connector>(`/connectors/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/connectors/${id}`);
        return response.data;
    },

    testConnection: async (id: string) => {
        const response = await api.post(`/connectors/${id}/test`);
        return response.data;
    }
};
