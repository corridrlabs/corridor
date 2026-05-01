import api from './api';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    avatar: string;
    last_active: string;
    status: 'active' | 'invited' | 'inactive';
}

export const teamService = {
    getAll: async () => {
        const response = await api.get<TeamMember[]>('/team');
        return response.data;
    },

    invite: async (email: string, role: string) => {
        const response = await api.post<TeamMember>('/team/invite', { email, role });
        return response.data;
    },

    remove: async (id: string) => {
        const response = await api.delete(`/team/${id}`);
        return response.data;
    },

    updateRole: async (id: string, role: string) => {
        const response = await api.put<TeamMember>(`/team/${id}/role`, null, { params: { role } });
        return response.data;
    }
};
