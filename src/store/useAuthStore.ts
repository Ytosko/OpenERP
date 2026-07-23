import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface User {
  id: string;
  employee_code?: string;
  email?: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'inventory_manager' | 'accountant' | 'viewer';
}

export interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  currency_code: string;
  role: string;
  default_store_id?: string;
}

const ACTIVE_PROJECT_KEY = 'modular_pos_active_project_id';

interface AuthState {
  user: User | null;
  session: Session | null;
  activeProject: ProjectInfo | null;
  projects: ProjectInfo[];
  isAuthenticated: boolean;
  /** false until the initial session restore has completed */
  authReady: boolean;

  initAuth: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; hasProject?: boolean }>;
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirm?: boolean }>;
  refreshProjects: () => Promise<ProjectInfo[]>;
  setActiveProject: (project: ProjectInfo | null) => void;
  selectProject: (projectId: string) => Promise<void>;
  logout: () => Promise<void>;
}

function mapSupabaseUser(su: SupabaseUser, role: User['role'] = 'viewer'): User {
  return {
    id: su.id,
    email: su.email || undefined,
    full_name: (su.user_metadata?.full_name as string) || su.email || 'User',
    role,
  };
}

async function fetchDefaultStoreId(projectId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, is_default')
    .eq('project_id', projectId)
    .order('is_default', { ascending: false })
    .limit(1);
  if (error) {
    console.error('Failed to load default store:', error.message);
    return undefined;
  }
  return data?.[0]?.id;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  activeProject: null,
  projects: [],
  isAuthenticated: false,
  authReady: false,

  initAuth: async () => {
    if (!isSupabaseConfigured()) {
      set({ authReady: true });
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      set({
        session: data.session,
        user: mapSupabaseUser(data.session.user),
        isAuthenticated: true,
      });
      await get().refreshProjects();
    }
    set({ authReady: true });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, session: null, isAuthenticated: false, activeProject: null, projects: [] });
      } else if (session.user) {
        const current = get().user;
        set({
          session,
          user: current && current.id === session.user.id ? current : mapSupabaseUser(session.user),
          isAuthenticated: true,
        });
      }
    });
  },

  loginWithEmail: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and rebuild.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      return { success: false, error: error?.message || 'Authentication failed.' };
    }

    set({
      session: data.session,
      user: mapSupabaseUser(data.session.user),
      isAuthenticated: true,
    });

    const projects = await get().refreshProjects();
    return { success: true, hasProject: projects.length > 0 };
  },

  signUpWithEmail: async (fullName, email, password) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and rebuild.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Depending on project settings, Supabase may require email confirmation
    // before a session is issued.
    if (!data.session) {
      return { success: true, needsEmailConfirm: true };
    }

    set({
      session: data.session,
      user: mapSupabaseUser(data.session.user),
      isAuthenticated: true,
    });
    return { success: true };
  },

  refreshProjects: async () => {
    const { data, error } = await supabase
      .from('project_members')
      .select('role, projects(id, name, slug, logo_url, currency_code)')
      .eq('status', 'active');

    if (error) {
      console.error('Failed to load projects:', error.message);
      return [];
    }

    const projects: ProjectInfo[] = (data || [])
      .filter((row: any) => row.projects)
      .map((row: any) => ({
        id: row.projects.id,
        name: row.projects.name,
        slug: row.projects.slug,
        logo_url: row.projects.logo_url || undefined,
        currency_code: row.projects.currency_code || 'USD',
        role: row.role,
      }));

    set({ projects });

    if (projects.length > 0) {
      const storedId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      const target = projects.find((p) => p.id === storedId) || projects[0];
      const default_store_id = await fetchDefaultStoreId(target.id);
      const user = get().user;
      set({
        activeProject: { ...target, default_store_id },
        user: user ? { ...user, role: target.role as User['role'] } : user,
      });
    } else {
      set({ activeProject: null });
    }

    return projects;
  },

  setActiveProject: (project) => {
    if (project) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
    set({ activeProject: project });
  },

  selectProject: async (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    const default_store_id = await fetchDefaultStoreId(projectId);
    const user = get().user;
    set({
      activeProject: { ...project, default_store_id },
      user: user ? { ...user, role: project.role as User['role'] } : user,
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    set({ user: null, session: null, isAuthenticated: false, activeProject: null, projects: [] });
  },
}));
