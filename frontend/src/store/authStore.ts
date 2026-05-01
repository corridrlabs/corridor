import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User, RegistrationData } from '../api/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    platformPreference: 'whatsapp' | 'webapp' | null;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    setPlatformPreference: (platform: 'whatsapp' | 'webapp' | null) => void;
    login: (email: string, password: string) => Promise<User>;
    register: (data: RegistrationData) => Promise<User>;
    loginWithGoogle: (token: string) => Promise<User>;
    refreshUser: () => Promise<User | null>;
    logout: () => void;
    initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: (() => {
                const stored = localStorage.getItem('token');
                if (!stored || stored === 'undefined' || stored === 'null') return null;
                return stored;
            })(),
            isAuthenticated: false,
            loading: true,
            platformPreference: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => {
                if (token && token !== 'undefined' && token !== 'null') {
                    localStorage.setItem('token', token);
                } else {
                    localStorage.removeItem('token');
                }
                set({ token: token && token !== 'undefined' && token !== 'null' ? token : null });
            },
            setLoading: (loading) => set({ loading }),
            setPlatformPreference: (platform) => set({ platformPreference: platform }),

            login: async (email, password) => {
                const response = await authApi.login({ email, password });
                if (!response?.access_token) {
                    throw new Error('Login succeeded but no access token was returned.');
                }
                get().setToken(response.access_token);
                const userData = await authApi.getCurrentUser();
                get().setUser(userData);
                return userData;
            },

            register: async (data) => {
                const response = await authApi.register(data);
                if (!response?.access_token) {
                    throw new Error('Registration succeeded but no access token was returned.');
                }
                get().setToken(response.access_token);
                const userData = await authApi.getCurrentUser();
                get().setUser(userData);
                return userData;
            },

            loginWithGoogle: async (token) => {
                const response = await authApi.googleLogin(token);
                if (!response?.access_token) {
                    throw new Error('Google login succeeded but no access token was returned.');
                }
                get().setToken(response.access_token);
                const userData = await authApi.getCurrentUser();
                get().setUser(userData);
                return userData;
            },

            refreshUser: async () => {
                const currentToken = get().token;
                if (!currentToken) {
                    return null;
                }

                try {
                    const userData = await authApi.getCurrentUser();
                    get().setUser(userData);
                    return userData;
                } catch (error) {
                    if (get().token === currentToken) {
                        get().setToken(null);
                        get().setUser(null);
                    }
                    return null;
                }
            },

            logout: () => {
                get().setToken(null);
                get().setUser(null);
                get().setPlatformPreference(null);
                window.location.href = '/login';
            },

            initializeAuth: async () => {
                await get().refreshUser();
                get().setLoading(false);
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                platformPreference: state.platformPreference
            }),
        }
    )
);

// Initialize auth on app load
if (typeof window !== 'undefined') {
    useAuthStore.getState().initializeAuth();
}
