import { apiClient } from '../api/client';

export interface Employee {
    id: string;
    organization_id: string;
    name: string;
    phone_number: string;
    email?: string;
    salary_amount: number;
    salary_currency: string;
    is_active: boolean;
    created_at: string;
}

export interface AdvanceRequest {
    id: string;
    employee_id: string;
    amount_requested: number;
    fee_amount: number;
    total_repayment_amount: number;
    status: 'pending' | 'approved' | 'disbursed' | 'repaid' | 'rejected';
    requested_at: string;
    approved_at?: string;
    disbursed_at?: string;
    repaid_at?: string;
}

export interface Eligibility {
    available_amount: number;
    currency: string;
    accrued_salary: number;
    outstanding_advances: number;
    reason: string;
}

export const ewaService = {
    // Employee Management
    getEmployees: async (): Promise<Employee[]> => {
        const response = await apiClient.get('/api/employees');
        return response.data;
    },

    importEmployees: async (file: File): Promise<Employee[]> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/employees/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Advance Management
    checkEligibility: async (employeeId: string): Promise<Eligibility> => {
        const response = await apiClient.get(`/api/employees/me/ewa/earnings?employee_id=${employeeId}`);
        return response.data;
    },

    requestAdvance: async (employeeId: string, amount: number): Promise<AdvanceRequest> => {
        const response = await apiClient.post('/api/employees/me/ewa/advance', {
            employee_id: employeeId,
            amount,
        });
        return response.data;
    },

    getRequests: async (): Promise<AdvanceRequest[]> => {
        const response = await apiClient.get('/api/account/ewa/requests');
        return response.data;
    },

    getFloatBalance: async (): Promise<{ balance: number, currency: string, status: string }> => {
        const response = await apiClient.get('/api/employees/ewa/dashboard');
        return response.data;
    }
};
