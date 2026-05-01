import { apiClient } from './client';

export interface APIKey {
    id: string;
    account_id: string;
    prefix: string;
    name?: string;
    is_active: boolean;
    is_live: boolean;
    last_used_at?: string;
    created_at: string;
    key?: string; // Only returned on creation
}

export interface CreateAPIKeyData {
    name?: string;
    is_live: boolean;
}

export const apiKeysApi = {
    /**
     * List all API keys for the current account
     */
    listKeys: async (): Promise<APIKey[]> => {
        try {
            const response = await apiClient.get('/api/api-keys');
            return (response?.data?.data ?? response?.data ?? []) as APIKey[];
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
            return [];
        }
    },

    /**
     * Create a new API key
     */
    createKey: async (data: CreateAPIKeyData): Promise<APIKey> => {
        const response = await apiClient.post('/api/api-keys', data);
        return (response?.data?.data ?? response?.data) as APIKey;
    },

    /**
     * Revoke an API key
     */
    revokeKey: async (keyId: string): Promise<void> => {
        await apiClient.post(`/api/api-keys/revoke?id=${keyId}`);
    },
};
