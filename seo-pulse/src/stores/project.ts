import { create } from 'zustand';
import { fetchUserProjects, createDefaultProject } from '@/lib/supabase';

export interface Project {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  trackedKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

const ACTIVE_PROJECT_KEY = 'caposeo.activeProjectId'

function persistActiveId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

function rehydrateActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  } catch {
    return null
  }
}

function makeMockProject(): Project {
  const now = new Date().toISOString()
  return {
    id: 'mock-default-project',
    name: 'My Site',
    domain: 'example.com',
    competitors: [],
    trackedKeywords: [],
    createdAt: now,
    updatedAt: now,
  }
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

  setActiveProject: (id) => {
    persistActiveId(id)
    set({ activeProjectId: id })
  },

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (id, partial) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...partial } : p,
      ),
    })),

  removeProject: (id) =>
    set((state) => {
      const nextActiveId = state.activeProjectId === id ? null : state.activeProjectId
      persistActiveId(nextActiveId)
      return {
        projects: state.projects.filter((p) => p.id !== id),
        activeProjectId: nextActiveId,
      }
    }),

  loadFromDB: async (userId: string) => {
    set({ loading: true })

    // Dev-user bypass — no Supabase round-trip
    if (userId === 'dev-user') {
      const mock = makeMockProject()
      const storedId = rehydrateActiveId()
      const activeId = storedId === mock.id ? storedId : mock.id
      persistActiveId(activeId)
      set({ projects: [mock], activeProjectId: activeId, loading: false })
      return
    }

    try {
      let projects = await fetchUserProjects(userId)

      // Auto-create default project for brand-new users
      if (projects.length === 0) {
        try {
          const defaultProject = await createDefaultProject(userId)
          projects = [defaultProject]
        } catch (createErr) {
          console.error('[project store] createDefaultProject failed:', createErr)
        }
      }

      // Rehydrate activeProjectId from localStorage if the project still exists
      const storedId = rehydrateActiveId()
      const storedStillValid = storedId ? projects.some((p) => p.id === storedId) : false
      const activeId = storedStillValid
        ? storedId!
        : projects.length > 0
        ? projects[0].id
        : null

      persistActiveId(activeId)
      set({ projects, activeProjectId: activeId, loading: false })
    } catch (err) {
      console.error('[project store] loadFromDB:', err)
      set({ loading: false })
    }
  },
}));
