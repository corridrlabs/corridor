import { apiClient } from './client';

export const reportsApi = {
    /**
     * Get saved reports for an organization
     */
    async getReports(orgId: string) {
        const response = await apiClient.get(`/api/reports`, {
            params: { org_id: orgId }
        });
        return response.data;
    },

    /**
     * Get available metrics
     */
    async getMetrics() {
        const response = await apiClient.get('/api/reports/metrics');
        return response.data;
    },

    /**
     * Get available dimensions
     */
    async getDimensions() {
        const response = await apiClient.get('/api/reports/dimensions');
        return response.data;
    },

    /**
     * Export a report
     */
    async exportReport(reportId: string, format: string) {
        const response = await apiClient.get(`/api/reports/${reportId}/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    }
};
