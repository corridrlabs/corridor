import axios from 'axios';
import { API_PREFIX } from '../config/env';

export interface OnboardingPreferences {
    path: 'guided' | 'ai' | 'quick';
    onboarding_mode?: 'guided' | 'ai' | 'quick';
    account_type?: 'PERSONAL' | 'BUSINESS';
    username?: string;
    country?: string;
    timezone?: string;
    default_currency?: string;
    notification_email?: string;
    business_info?: {
        name?: string;
        industry?: string;
        size?: string;
        company_stage?: 'solo' | 'startup' | 'growth' | 'enterprise';
        primary_goal?: string;
        primary_use_case?: 'full_platform' | 'social_only' | 'ewa_only' | 'api_partner';
        website?: string;
        kyc?: {
            id_type: string;
            id_number: string;
            phone?: string;
        };
    };
    selected_features?: string[];
    selected_apps?: string[];
    selected_workflows?: string[];
    wallet_setup?: {
        phone?: string;
        provider?: string;
        address?: string;
        network?: string;
    };
    selected_plan?: string;
    recommendations?: {
        mode?: 'guided' | 'ai' | 'quick';
        features?: string[];
        workflows?: string[];
        apps?: string[];
    };
}

export interface OnboardingResponse {
    success: boolean;
    message: string;
    onboarding_completed: boolean;
}

export interface OnboardingStatus {
    onboarding_completed: boolean;
    onboarding_path: string | null;
}

export interface OnboardingAIRequest {
    account_type?: 'PERSONAL' | 'BUSINESS';
    country?: string;
    timezone?: string;
    default_currency?: string;
    notification_email?: string;
    business_name?: string;
    industry?: string;
    employee_count?: number;
    company_stage?: 'solo' | 'startup' | 'growth' | 'enterprise';
    primary_goal?: string;
    primary_use_case?: 'full_platform' | 'social_only' | 'ewa_only' | 'api_partner';
    website?: string;
}

export interface OnboardingAIRecommendation {
    features: string[];
    apps: string[];
    workflows: string[];
    dashboard_layout: string;
    default_view: string;
    summary: string;
    reasoning: string;
}

export const onboardingService = {
    /**
     * Save user's onboarding preferences to backend
     */
    async savePreferences(preferences: OnboardingPreferences): Promise<OnboardingResponse> {
        const token = localStorage.getItem('token');
        const response = await axios.post<OnboardingResponse>(
            `${API_PREFIX}/onboarding/preferences`,
            preferences,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },

    /**
     * Check if user has completed onboarding
     */
    async getStatus(): Promise<OnboardingStatus> {
        const token = localStorage.getItem('token');
        const response = await axios.get<OnboardingStatus>(
            `${API_PREFIX}/onboarding/status`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        return response.data;
    },

    async getAIRecommendations(payload: OnboardingAIRequest): Promise<OnboardingAIRecommendation> {
        const token = localStorage.getItem('token');
        const response = await axios.post<OnboardingAIRecommendation>(
            `${API_PREFIX}/onboarding/ai/recommendations`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }
};
