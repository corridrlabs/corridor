import { apiClient } from './client';

export const monitoringApi = {
    /**
     * Get KPIs for an organization
     */
    async getKpis(orgId: string) {
        const response = await apiClient.get(`/api/monitoring/kpis`, {
            params: { org_id: orgId }
        });
        return response.data;
    },

    /**
     * Get workflow timeline
     */
    async getWorkflowTimeline(orgId: string, days: number = 7) {
        const response = await apiClient.get(`/api/monitoring/workflows/timeline`, {
            params: { org_id: orgId, days }
        });
        return response.data;
    },

    /**
     * Get workflow metrics
     */
    async getWorkflowMetrics(orgId: string) {
        const response = await apiClient.get(`/api/monitoring/workflows/metrics`, {
            params: { org_id: orgId }
        });
        return response.data;
    },

    /**
     * Get recent executions
     */
    async getExecutions(orgId: string, limit: number = 10) {
        const response = await apiClient.get(`/api/workflows/executions`, {
            params: { org_id: orgId, limit }
        });
        return response.data;
    },

    /**
     * Get active alerts
     */
    async getAlerts(orgId: string) {
        const response = await apiClient.get(`/api/monitoring/alerts`, {
            params: { org_id: orgId }
        });
        return response.data;
    }
};
