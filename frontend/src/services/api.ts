import axios from 'axios';

// Use the same env var as api/client.ts so production builds point to the real backend.
// Falls back to '/api' for local dev where the Vite proxy handles forwarding.
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || ''


const api = axios.create({
    baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => {
        // Normalize backend envelope responses: { data: ... } -> ...
        if (
            response?.data &&
            typeof response.data === 'object' &&
            !Array.isArray(response.data) &&
            Object.prototype.hasOwnProperty.call(response.data, 'data')
        ) {
            response.data = (response.data as any).data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Redirect to login or handle token refresh here
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export { api as apiClient };
export default api;
