import axios from 'axios';
import { API_PREFIX } from '../config/env';

export interface Position {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string;
    is_active: boolean;
    created_at: string;
}

export interface Applicant {
    id: number;
    name: string;
    email: string;
    phone: string;
    resume_url?: string;
    cover_letter?: string;
    position_id: number;
    status: string;
    applied_at: string;
    position?: Position;
}

export const careersService = {
    getPositions: async (): Promise<Position[]> => {
        const response = await axios.get(`${API_PREFIX}/careers/positions`);
        return response.data;
    },

    createPosition: async (position: Omit<Position, 'id' | 'created_at'>): Promise<Position> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_PREFIX}/careers/positions`, position, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    applyForPosition: async (applicant: Omit<Applicant, 'id' | 'status' | 'applied_at'>): Promise<Applicant> => {
        const response = await axios.post(`${API_PREFIX}/careers/apply`, applicant);
        return response.data;
    },

    getApplicants: async (): Promise<Applicant[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_PREFIX}/careers/applicants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
