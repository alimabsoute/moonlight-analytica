import { create } from 'zustand';
import { fetchUserProjects } from '@/lib/supabase';

export interface Project {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  trackedKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;

  readonly activeProject: Project | undefined;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  removeProject: (id: string) => void;
  loadFromDB: (userId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,

  get activeProject() {
    const state = get();
    return state.projects.find((p) => p.id === state.activeProjectId);
  },

  setProjects: (projects) => set({ projects }),

  setActiveProject: (id) => set({ activeProjectId: id }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (id, partial) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...partial } : p,
      ),
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId:
        state.activeProjectId === id ? null : state.activeProjectId,
    })),

  loadFromDB: async (userId: string) => {
    set({ loading: true })
    try {
      const projects = await fetchUserProjects(userId)
      set({ projects, loading: false })
      if (projects.length > 0 && !get().activeProjectId) {
        set({ activeProjectId: projects[0].id })
      }
    } catch (err) {
      console.error('[project store] loadFromDB:', err)
      set({ loading: false })
    }
  },
}));
