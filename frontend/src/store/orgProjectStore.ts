import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { accountApi, Project } from '../api/account';

interface AccountProjectState {
  projects: Project[];
  currentProjectId: string | null;
  loadingProjects: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (projectId: string | null) => void;
  createProject: (payload: { name: string; description?: string; environment?: string; region?: string }) => Promise<Project>;
  clearError: () => void;
}

export const useOrgProjectStore = create<AccountProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      loadingProjects: false,
      error: null,

      clearError: () => set({ error: null }),

      fetchProjects: async () => {
        try {
          set({ loadingProjects: true, error: null });
          const projects = await accountApi.getProjects();
          set((state) => ({
            projects,
            currentProjectId:
              state.currentProjectId && projects.find((p) => p.id === state.currentProjectId)
                ? state.currentProjectId
                : projects[0]?.id || null,
          }));
        } catch (err: any) {
          set({ error: err?.message || 'Unable to load projects' });
        } finally {
          set({ loadingProjects: false });
        }
      },

      setCurrentProject: (projectId: string | null) => set({ currentProjectId: projectId }),

      createProject: async (payload) => {
        const project = await accountApi.createProject(payload);
        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: project.id,
        }));
        return project;
      },
    }),
    {
      name: 'account-project-store',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        projects: state.projects,
      }),
    }
  )
);
