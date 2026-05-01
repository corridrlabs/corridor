import api from './api';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
}

export interface BusinessProfile {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    description?: string;
    country?: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateProfileRequest {
    full_name?: string;
    phone_number?: string;
}

export interface UpdateBusinessRequest {
    name?: string;
    industry?: string;
    website?: string;
    description?: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/accounts/settings');
        const payload = response?.data?.data ?? response?.data ?? {};
        return {
            id: payload.id || '',
            email: payload.email || '',
            full_name: payload.full_name || '',
            phone_number: payload.whatsapp_phone || '',
            created_at: payload.created_at || new Date().toISOString(),
            updated_at: payload.updated_at || payload.created_at || new Date().toISOString(),
        };
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
        const response = await api.post('/accounts/settings', data);
        const payload = response?.data?.data ?? response?.data ?? {};
        return {
            id: payload.id || '',
            email: payload.email || '',
            full_name: payload.full_name || '',
            phone_number: payload.whatsapp_phone || '',
            created_at: payload.created_at || new Date().toISOString(),
            updated_at: payload.updated_at || payload.created_at || new Date().toISOString(),
        };
    },
};

export const businessService = {
    getProfile: async (): Promise<BusinessProfile> => {
        const response = await api.get('/accounts/settings');
        const payload = response?.data?.data ?? response?.data ?? {};
        const settings = payload.settings || {};
        return {
            id: payload.id || '',
            name: settings.company_name || '',
            industry: payload?.onboarding_data?.business_info?.industry || '',
            website: settings.website || '',
            description: settings.description || '',
            country: payload.country || '',
            created_at: payload.created_at || new Date().toISOString(),
            updated_at: payload.updated_at || payload.created_at || new Date().toISOString(),
        };
    },

    updateProfile: async (data: UpdateBusinessRequest): Promise<BusinessProfile> => {
        const response = await api.post('/accounts/settings', { company_name: data.name });
        const payload = response?.data?.data ?? response?.data ?? {};
        const settings = payload.settings || {};
        return {
            id: payload.id || '',
            name: settings.company_name || data.name || '',
            industry: data.industry || '',
            website: data.website || '',
            description: data.description || '',
            country: payload.country || '',
            created_at: payload.created_at || new Date().toISOString(),
            updated_at: payload.updated_at || payload.created_at || new Date().toISOString(),
        };
    },
};
