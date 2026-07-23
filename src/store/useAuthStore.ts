import { create } from 'zustand';

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  access_token: string;
  user?: User;
}

export interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  currency_code: string;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  projects: ProjectInfo[];
  activeProject: ProjectInfo | null;
  loading: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setProjects: (projects: ProjectInfo[]) => void;
  setActiveProject: (project: ProjectInfo | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  projects: [],
  activeProject: null,
  loading: true,
  setAuth: (user, session) => set({ user, session }),
  setProjects: (projects) =>
    set((state) => ({
      projects,
      activeProject: state.activeProject ?? (projects.length > 0 ? projects[0] : null),
    })),
  setActiveProject: (activeProject) => set({ activeProject }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, session: null, projects: [], activeProject: null }),
}));
