import api from './api';

export interface Project {
    id: string;
    name: string;
    description: string;
    industry: string;
    employeeCount: number;
    createdAt: string;
}

interface ProjectResponse {
    id: string;
    name: string;
    description: string;
    industry: string;
    employee_count: number;
    created_at: string;
}

export const projectsService = {
    getAll: async () => {
        const response = await api.get<ProjectResponse[]>('/projects');
        return response.data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            industry: p.industry,
            employeeCount: p.employee_count,
            createdAt: p.created_at
        }));
    },

    create: async (project: Omit<Project, 'id' | 'createdAt'>) => {
        const response = await api.post<ProjectResponse>('/projects', {
            name: project.name,
            description: project.description,
            industry: project.industry,
            employee_count: project.employeeCount
        });
        const p = response.data;
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            industry: p.industry,
            employeeCount: p.employee_count,
            createdAt: p.created_at
        };
    },

    update: async (id: string, updates: Partial<Project>) => {
        const payload: any = { ...updates };
        if (updates.employeeCount !== undefined) {
            payload.employee_count = updates.employeeCount;
            delete payload.employeeCount;
        }
        // createdAt is usually not updatable

        const response = await api.put<ProjectResponse>(`/projects/${id}`, payload);
        const p = response.data;
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            industry: p.industry,
            employeeCount: p.employee_count,
            createdAt: p.created_at
        };
    },

    delete: async (id: string) => {
        await api.delete(`/projects/${id}`);
    }
};
