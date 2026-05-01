import { apiClient } from './client';

export interface AccountSettings {
    company_name: string;
    logo_url: string;
    timezone: string;
    default_currency: string;
    notification_email: string;
    username?: string;
    account_type?: string;
    country?: string;
}

export interface AccountSettingsUpdate {
    company_name?: string;
    logo_url?: string;
    timezone?: string;
    default_currency?: string;
    notification_email?: string;
    username?: string;
    account_type?: string;
    country?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
}

export interface AccountMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

export interface UsageMetrics {
    api_requests_count: number;
    api_requests_limit: number;
    team_members_count: number;
    team_members_limit: number;
    projects_count: number;
    projects_limit: number;
    storage_used_mb: number;
    storage_limit_mb: number;
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    region: string | null;
    status: string;
    created_at: string;
}

export interface LiquidityStats {
    total_usdc: number;
    total_kes: number;
    active_sweeps: number;
    active_workflows: number;
}

export interface EWASettings {
    id: string;
    account_id: string;
    is_enabled: boolean;
    percentage_accessible: number;
    max_withdrawal_per_period: number;
    transaction_fee: number;
    cooldown_period_days: number;
}

export interface FeatureAccessState {
    allowed: boolean;
    required_plan: 'free' | 'pro' | 'premium' | 'enterprise';
    label: string;
}

export type FeatureAccessMap = Record<string, FeatureAccessState>;

const unwrap = <T>(response: any): T => {
    return (response?.data?.data ?? response?.data) as T;
};

const asArray = <T>(value: any): T[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.keys)) return value.keys;
    if (Array.isArray(value?.webhooks)) return value.webhooks;
    return [];
};

export const accountApi = {
    /**
     * Get account settings
     */
    getNotifications: async (): Promise<any[]> => {
        const response = await apiClient.get("/api/notifications");
        return asArray<any>(unwrap<any>(response));
    },
    getSettings: async (): Promise<AccountSettings> => {
        const response = await apiClient.get('/api/accounts/settings');
        const payload = unwrap<any>(response) || {};
        const settings = payload.settings || {};
        return {
            company_name: settings.company_name || payload.full_name || '',
            logo_url: settings.logo_url || '',
            timezone: settings.timezone || payload.timezone || 'UTC',
            default_currency: settings.default_currency || payload.default_currency || 'USD',
            notification_email: settings.notification_email || payload.email || '',
            username: payload.username || '',
            account_type: payload.account_type || '',
            country: payload.country || '',
        };
    },

    /**
     * Update account settings
     */
    updateSettings: async (settings: AccountSettingsUpdate): Promise<AccountSettings> => {
        const response = await apiClient.post('/api/accounts/settings', settings);
        const payload = unwrap<any>(response) || {};
        const updated = payload.settings || {};
        return {
            company_name: updated.company_name || payload.full_name || settings.company_name || '',
            logo_url: updated.logo_url || settings.logo_url || '',
            timezone: updated.timezone || settings.timezone || 'UTC',
            default_currency: updated.default_currency || settings.default_currency || 'USD',
            notification_email: updated.notification_email || payload.email || settings.notification_email || '',
            username: payload.username || settings.username || '',
            account_type: payload.account_type || settings.account_type || '',
            country: payload.country || settings.country || '',
        };
    },

    /**
     * Get current account info (alias for auth.getMe)
     */
    getInfo: async () => {
        const response = await apiClient.get('/api/auth/me');
        return unwrap<any>(response);
    },

    getMembers: async (): Promise<AccountMember[]> => {
        try {
            const response = await apiClient.get('/api/organization');
            const payload = unwrap<any>(response);
            return asArray<AccountMember>(payload.members);
        } catch (error: any) {
            if (error?.response?.status === 404 || error?.response?.status === 402) {
                return [];
            }
            console.error('Failed to fetch members:', error);
            return [];
        }
    },
    inviteMember: async (payload: any) => {
        const response = await apiClient.post('/api/organization/members', payload);
        return unwrap<any>(response);
    },
    removeMember: async (memberId: string) => {
        const response = await apiClient.delete(`/api/organization/members/remove?id=${memberId}`);
        return unwrap<any>(response);
    },
    getUsage: async (): Promise<UsageMetrics> => {
        try {
            const response = await apiClient.get('/api/billing/usage');
            const usage = unwrap<any>(response) || {};
            return {
                api_requests_count: Number(usage.api_requests || usage.api_requests_count || 0),
                api_requests_limit: Number(usage.api_requests_limit || 0),
                team_members_count: Number(usage.customers_count || usage.team_members_count || 0),
                team_members_limit: Number(usage.team_members_limit || 0),
                projects_count: Number(usage.transactions_count || usage.projects_count || 0),
                projects_limit: Number(usage.projects_limit || 0),
                storage_used_mb: Number(usage.storage_mb || usage.storage_used_mb || 0),
                storage_limit_mb: Number(usage.storage_limit_mb || 0),
            };
        } catch (_error) {
            return {
                api_requests_count: 0,
                api_requests_limit: 0,
                team_members_count: 0,
                team_members_limit: 0,
                projects_count: 0,
                projects_limit: 0,
                storage_used_mb: 0,
                storage_limit_mb: 0,
            };
        }
    },
    getActivity: async (limit = 10): Promise<{ activities: any[] }> => {
        try {
            const notifications = await accountApi.getNotifications();
            const isDemoActivity = (text: string) => /^(member\s+)?(transfer after funding|top-up via bank)/i.test(text.trim());
            const activities = asArray<any>(notifications)
                .filter((n: any) => {
                    const text = `${n?.message || ''} ${n?.title || ''}`.trim();
                    return text.length > 0 && !isDemoActivity(text);
                })
                .slice(0, limit)
                .map((n: any) => ({
                type: n.type || 'notification',
                description: n.message || n.title || 'Activity recorded',
                timestamp: n.created_at || new Date().toISOString(),
            }));
            return { activities };
        } catch (_error) {
            return { activities: [] };
        }
    },
    getFeatureAccess: async (): Promise<FeatureAccessMap> => {
        try {
            const response = await apiClient.get('/api/account/feature-access');
            const payload = unwrap<any>(response) || {};
            return payload as FeatureAccessMap;
        } catch (_error) {
            return {};
        }
    },
    getApiKeys: async () => {
        try {
            const response = await apiClient.get('/api/api-keys');
            return asArray<any>(unwrap<any>(response));
        } catch (error: any) {
            if (error?.response?.status === 404 || error?.response?.status === 402) {
                return [];
            }
            console.error('Failed to fetch API keys:', error);
            return [];
        }
    },
    createApiKey: async (payload: any) => {
        const response = await apiClient.post('/api/api-keys', payload);
        return unwrap<any>(response);
    },
    revokeApiKey: async (keyId: string) => {
        const response = await apiClient.post(`/api/api-keys/revoke?id=${keyId}`);
        return unwrap<any>(response);
    },
    getWebhooks: async () => {
        try {
            const response = await apiClient.get('/api/webhooks');
            return asArray<any>(unwrap<any>(response));
        } catch (error: any) {
            if (error?.response?.status === 404) {
                try {
                    const fallback = await apiClient.get('/api/account/webhooks');
                    return asArray<any>(unwrap<any>(fallback));
                } catch (fallbackError: any) {
                    if (fallbackError?.response?.status === 404) {
                        return [];
                    }
                    throw fallbackError;
                }
            }
            throw error;
        }
    },
    createWebhook: async (payload: any) => {
        try {
            const response = await apiClient.post('/api/webhooks', payload);
            return unwrap<any>(response);
        } catch (error: any) {
            if (error?.response?.status === 404) {
                const fallback = await apiClient.post('/api/account/webhooks', payload);
                return unwrap<any>(fallback);
            }
            throw error;
        }
    },
    deleteWebhook: async (webhookId: string) => {
        try {
            const response = await apiClient.post(`/api/webhooks/delete?id=${webhookId}`);
            return unwrap<any>(response);
        } catch (error: any) {
            if (error?.response?.status === 404) {
                const fallback = await apiClient.post(`/api/account/webhooks/delete?id=${webhookId}`);
                return unwrap<any>(fallback);
            }
            throw error;
        }
    },
    getProjects: async (): Promise<Project[]> => {
        try {
            const response = await apiClient.get('/api/projects');
            return asArray<Project>(unwrap<any>(response));
        } catch (error: any) {
            if (error?.response?.status === 404) {
                return [];
            }
            throw error;
        }
    },
    createProject: async (payload: any): Promise<Project> => {
        const response = await apiClient.post('/api/projects', payload);
        return unwrap<Project>(response);
    },

    // EWA Methods
    getEWASettings: async (): Promise<EWASettings> => {
        try {
            const response = await apiClient.get('/api/account/ewa/settings');
            return unwrap<EWASettings>(response);
        } catch (error: any) {
            if (error?.response?.status === 402 || error?.response?.status === 404) {
                return null as any;
            }
            console.error('Failed to fetch EWA settings:', error);
            return null as any;
        }
    },
    updateEWASettings: async (settings: Partial<EWASettings>): Promise<EWASettings> => {
        const response = await apiClient.post('/api/account/ewa/settings', settings);
        return unwrap<EWASettings>(response);
    },
    getEWAEmployees: async (): Promise<any[]> => {
        const response = await apiClient.get('/api/ewa/employees');
        return response.data;
    },
    getEWARequests: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/api/ewa/requests');
            return asArray<any>(unwrap<any>(response));
        } catch (error: any) {
            if (error?.response?.status === 404 || error?.response?.status === 402) {
                return [];
            }
            console.error('Failed to fetch EWA requests:', error);
            return [];
        }
    },
    updateEWAPolicy: async (policy: Partial<EWASettings>): Promise<EWASettings> => {
        const response = await apiClient.post('/api/account/ewa/policy', policy);
        return unwrap<EWASettings>(response);
    },

    // Treasury & Liquidity Methods
    getLiquidityStats: async (): Promise<LiquidityStats> => {
        try {
            const response = await apiClient.get('/api/account/liquidity');
            return unwrap<LiquidityStats>(response);
        } catch (error: any) {
            // Fallback when liquidity endpoint is unavailable or temporarily failing.
            if (error?.response?.status === 404 || error?.response?.status >= 500) {
                const walletsResponse = await apiClient.get('/api/wallets');
                const wallets = unwrap<Array<{ currency?: string; balance?: number }>>(walletsResponse) || [];
                const totalUSDC = wallets
                    .filter((w) => w.currency === 'USDC')
                    .reduce((sum, w) => sum + Number(w.balance || 0), 0);
                const totalKES = wallets
                    .filter((w) => w.currency === 'KES')
                    .reduce((sum, w) => sum + Number(w.balance || 0), 0);
                return {
                    total_usdc: totalUSDC,
                    total_kes: totalKES,
                    active_sweeps: 0,
                    active_workflows: 0,
                };
            }
            throw error;
        }
    },
    runRevenueSweep: async (): Promise<any> => {
        const response = await apiClient.post('/api/treasury/sweep');
        return unwrap<any>(response);
    }
};
