import axios from 'axios'

// Prefer Vite-style env var (VITE_API_URL). Some setups (previously Next) used
// NEXT_PUBLIC_API_URL. We support both and fall back to the provided Render
// backend URL so the frontend works out-of-the-box when deployed.
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || ''



export interface TierLimits {
  monthly_transactions: number
  api_calls: number
  team_members: number
  features: string[]
}

export interface User {
  id: string
  name?: string
  full_name?: string
  username?: string
  email: string
  whatsapp_phone?: string
  country?: string
  slug?: string
  callback_url?: string
  kyc_status?: string
  terms_accepted?: boolean
  privacy_accepted?: boolean
  kyc_consent?: boolean
  account_status?: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | string
  account_type?: 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE' | 'ADMIN'
  tier?: 'free' | 'pro' | 'enterprise'
  onboarding_completed?: boolean
  onboarding_data?: any
  settings?: {
    company_name?: string
    timezone?: string
    default_currency?: string
    notification_email?: string
    logo_url?: string
    [key: string]: any
  }
  preferences?: {
    dashboard_layout?: string
    [key: string]: any
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

export default apiClient;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors and network issues
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if we have a structured backend error response
    if (error.response?.data) {
      // Let the calling code handle specific API errors (400, 401, 403, 404, 500)
      // This preserves messages like "Invalid credentials" or "User not found"
      return Promise.reject(error)
    }

    // Handle genuine network errors (no response received)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      return Promise.reject({
        ...error,
        message: 'Unable to connect to server. Please check your internet connection.',
        isNetworkError: true,
      })
    }

    // Default fallback
    return Promise.reject(error)
  }
)
