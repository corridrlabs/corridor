import { apiClient, User } from './client'
export type { User } from './client'

export interface LoginData {
  email: string
  password: string
}

export interface OnboardingData {
  business_name: string
  whatsapp_phone: string
  country: string
  email: string
  password: string
}

export interface RegistrationData {
  email: string
  password: string
  name: string
  phone: string
  country: string
  accountType: 'PERSONAL' | 'BUSINESS'
  idType: string
  idNumber: string
  acceptTerms: boolean
  acceptPrivacy: boolean
  acceptKyc: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface ConsentEntry {
  id: string
  consent_type: string
  version: string
  granted: boolean
  granted_at: string
  withdrawn_at?: string | null
}

const unwrapResponseData = <T>(response: any): T => {
  // Backend often responds as { data: payload }. Some endpoints return payload directly.
  return (response?.data?.data ?? response?.data) as T
}

const normalizeUser = (user: User): User => {
  const fullName = user?.full_name || user?.name || ''
  return {
    ...user,
    full_name: fullName,
    name: fullName,
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const authApi = {
  login: (data: LoginData): Promise<AuthResponse> => {
    return apiClient.post('/api/auth/login', { ...data, email: normalizeEmail(data.email) }).then((res) => unwrapResponseData<AuthResponse>(res))
  },

  register: (data: RegistrationData): Promise<AuthResponse> => {
    return apiClient.post('/api/auth/register', {
      email: normalizeEmail(data.email),
      password: data.password,
      name: data.name,
      phone: data.phone,
      country: data.country,
      type: data.accountType,
      id_type: data.idType,
      id_number: data.idNumber,
      accept_terms: data.acceptTerms,
      accept_privacy: data.acceptPrivacy,
      accept_kyc: data.acceptKyc,
    }).then((res) => unwrapResponseData<AuthResponse>(res))
  },

  onboarding: (data: OnboardingData): Promise<AuthResponse> =>
    apiClient.post('/api/auth/onboarding', { ...data, email: normalizeEmail(data.email) }).then((res) => unwrapResponseData<AuthResponse>(res)),

  getMe: (): Promise<User> =>
    apiClient.get('/api/auth/me').then((res) => normalizeUser(unwrapResponseData<User>(res))),

  getCurrentUser: (): Promise<User> =>
    apiClient.get('/api/auth/me').then((res) => normalizeUser(unwrapResponseData<User>(res))),

  getConsents: (): Promise<{ consents: ConsentEntry[] }> =>
    apiClient.get('/api/compliance/consents').then((res) => unwrapResponseData<{ consents: ConsentEntry[] }>(res)),

  grantConsent: (consentType: 'terms_of_service' | 'privacy_policy' | 'kyc_consent', granted = true): Promise<void> =>
    apiClient.post('/api/compliance/consents', {
      consent_type: consentType,
      granted,
      version: '1.0',
    }).then(() => undefined),

  googleLogin: (token: string): Promise<AuthResponse> =>
    apiClient.post('/api/auth/google', { token }).then((res) => unwrapResponseData<AuthResponse>(res)),

  // Verification Methods
  checkUserExists: async (data: { email: string; phone?: string; idNumber?: string }): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/auth/check', {
        email: normalizeEmail(data.email),
        phone: data.phone || '',
        id_number: data.idNumber || '',
      });
      const payload = unwrapResponseData<{ exists?: boolean }>(response)
      return Boolean(payload?.exists)
    } catch (error) {
      return false;
    }
  },

  sendVerificationCode: async (channel: 'email' | 'whatsapp', contact: string): Promise<void> => {
    await apiClient.post('/api/auth/verify/send', { channel, contact });
  },

  verifyCode: async (contact: string, code: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/auth/verify/confirm', { contact, code });
      const payload = unwrapResponseData<{ valid?: boolean }>(response)
      return Boolean(payload?.valid)
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }
}
