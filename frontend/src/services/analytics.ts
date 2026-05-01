import api from './api';

export interface RevenueMetrics {
    total_revenue: number;
    mrr: number;
    arr: number;
    growth_rate: number;
}

export const analyticsService = {
    getRevenueMetrics: async () => {
        const response = await api.get<RevenueMetrics>('/analytics/revenue/metrics');
        return response.data;
    },

    getRevenueTrends: async (months: number = 6) => {
        const response = await api.get('/analytics/revenue/trends', { params: { months } });
        return response.data;
    },

    getRevenueByProduct: async () => {
        const response = await api.get('/analytics/revenue/by-product');
        return response.data;
    },

    getTopCustomers: async (limit: number = 5) => {
        const response = await api.get('/analytics/revenue/top-customers', { params: { limit } });
        return response.data;
    },

    getDashboards: async () => {
        const response = await api.get('/analytics/dashboards');
        return response.data;
    },

    getRealtimeMetrics: async () => {
        const response = await api.get('/analytics/realtime/metrics');
        return response.data;
    },

    getRealtimeActivity: async () => {
        const response = await api.get('/analytics/realtime/activity');
        return response.data;
    }
};
