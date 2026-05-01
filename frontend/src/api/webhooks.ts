import { apiClient } from './client';

export interface Webhook {
    id: string;
    account_id: string;
    url: string;
    events: string[];
    secret?: string; // Only returned on creation
    is_active: boolean;
    created_at: string;
}

export interface CreateWebhookData {
    url: string;
    events: string[];
}

export const webhooksApi = {
    /**
     * List all webhooks for the current account
     */
    listWebhooks: async (): Promise<Webhook[]> => {
        const response = await apiClient.get('/api/webhooks');
        return (response?.data?.data ?? response?.data ?? []) as Webhook[];
    },

    /**
     * Create a new webhook
     */
    createWebhook: async (data: CreateWebhookData): Promise<Webhook> => {
        const response = await apiClient.post('/api/webhooks', data);
        return (response?.data?.data ?? response?.data) as Webhook;
    },

    /**
     * Delete a webhook
     */
    deleteWebhook: async (webhookId: string): Promise<void> => {
        await apiClient.post(`/api/webhooks/delete?id=${webhookId}`);
    },
};

/**
 * Available webhook event types
 */
export const WEBHOOK_EVENTS = [
    'payment.success',
    'payment.failed',
    'invoice.paid',
    'invoice.overdue',
    'customer.created',
    'kyc.approved',
    'kyc.rejected',
] as const;
