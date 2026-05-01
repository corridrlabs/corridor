import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectsService, Project } from '../services/projects';
import { useToast } from './ToastContext';

interface ProjectContextType {
    currentProject: Project | null;
    projects: Project[];
    loading: boolean;
    setCurrentProject: (project: Project) => void;
    createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};

interface ProjectProviderProps {
    children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await projectsService.getAll();
            setProjects(data);
            if (data.length > 0 && !currentProject) {
                setCurrentProject(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            showToast('error', 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const createProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
        try {
            const newProject = await projectsService.create(projectData);
            setProjects([...projects, newProject]);
            setCurrentProject(newProject);
            showToast('success', 'Project created successfully');
        } catch (error) {
            console.error('Failed to create project:', error);
            showToast('error', 'Failed to create project');
            throw error;
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        try {
            const updatedProject = await projectsService.update(id, updates);
            setProjects(projects.map(p => p.id === id ? updatedProject : p));
            if (currentProject?.id === id) {
                setCurrentProject(updatedProject);
            }
            showToast('success', 'Project updated successfully');
        } catch (error) {
            console.error('Failed to update project:', error);
            showToast('error', 'Failed to update project');
            throw error;
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await projectsService.delete(id);
            const newProjects = projects.filter(p => p.id !== id);
            setProjects(newProjects);
            if (currentProject?.id === id) {
                setCurrentProject(newProjects.length > 0 ? newProjects[0] : null);
            }
            showToast('success', 'Project deleted successfully');
        } catch (error) {
            console.error('Failed to delete project:', error);
            showToast('error', 'Failed to delete project');
            throw error;
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                currentProject,
                projects,
                loading,
                setCurrentProject,
                createProject,
                updateProject,
                deleteProject,
                refreshProjects: fetchProjects
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export default ProjectContext;
