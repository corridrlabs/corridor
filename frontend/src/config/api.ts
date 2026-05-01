// API Configuration
export const API_CONFIG = {
    // Corridor Backend
    PAYDAY_API_URL: import.meta.env.VITE_API_URL || '',

    // Pepa Backend
    PEPA_API_URL: import.meta.env.VITE_PEPA_API_URL || '',

    // Supabase
    SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// API Endpoints
export const ENDPOINTS = {
    // Corridor endpoints
    PAYDAY: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            VERIFY_EMAIL: '/api/v1/auth/verify-email',
            RESEND_VERIFICATION: '/api/v1/auth/resend-verification',
        },
        BUSINESS: {
            REGISTER: '/api/v1/business/register',
            STATS: '/api/v1/business/stats',
            API_KEYS: '/api/v1/business/api-keys',
        },
        WEBHOOKS: '/api/v1/webhooks',
        PLANS: '/api/v1/plans',
    },

    // Pepa endpoints
    PEPA: {
        BUSINESS: {
            REGISTER: '/api/v1/business/register',
            API_KEYS: '/api/v1/business/api-keys',
            CHECKOUT: '/api/v1/business/checkout',
        },
    },
};
