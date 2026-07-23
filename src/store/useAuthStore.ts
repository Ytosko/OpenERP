import { create } from 'zustand';

export interface User {
  id: string;
  employee_code: string;
  email?: string;
  full_name: string;
  role: 'superadmin' | 'owner' | 'admin' | 'manager' | 'cashier' | 'inventory_manager' | 'accountant';
}

export interface Session {
  token: string;
  expiresAt: number;
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
  activeProject: ProjectInfo | null;
  isAuthenticated: boolean;
  loginWithEmployeeCode: (codeOrEmail: string, pass: string) => { success: boolean; error?: string };
  setActiveProject: (project: ProjectInfo | null) => void;
  logout: () => void;
}

const STORAGE_USER_KEY = 'modular_pos_auth_user';
const STORAGE_SESSION_KEY = 'modular_pos_auth_session';

const loadSavedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadSavedSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const sess: Session = JSON.parse(raw);
    if (Date.now() > sess.expiresAt) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      return null;
    }
    return sess;
  } catch {
    return null;
  }
};

const savedUser = loadSavedUser();
const savedSession = loadSavedSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  session: savedSession,
  isAuthenticated: !!(savedUser && savedSession),
  activeProject: {
    id: 'proj-101',
    name: 'Hacker Mart General Store',
    slug: 'hacker-mart',
    currency_code: 'USD',
    role: savedUser?.role || 'cashier',
  },

  setActiveProject: (activeProject) => set({ activeProject }),

  loginWithEmployeeCode: (codeOrEmail, pass) => {
    const envSuperUser = import.meta.env.VITE_SUPERADMIN_USER || 'superadmin';
    const envSuperPass = import.meta.env.VITE_SUPERADMIN_PASS || 'admin123';

    // 1. Superadmin check from ENV
    if (
      codeOrEmail.trim().toLowerCase() === envSuperUser.toLowerCase() &&
      pass === envSuperPass
    ) {
      const superUser: User = {
        id: 'usr-superadmin',
        employee_code: envSuperUser,
        email: 'superadmin@pos.ytosko.dev',
        full_name: 'Super Admin',
        role: 'superadmin',
      };
      const session: Session = {
        token: `sess-super-${Date.now()}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 Hours
      };

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(superUser));
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

      set({
        user: superUser,
        session,
        isAuthenticated: true,
        activeProject: {
          id: 'proj-101',
          name: 'Hacker Mart General Store',
          slug: 'hacker-mart',
          currency_code: 'USD',
          role: 'superadmin',
        },
      });

      return { success: true };
    }

    // 2. Demo Cashier / Employee Code checks
    const EMPLOYEES: Record<string, { pass: string; name: string; role: User['role'] }> = {
      'EMP-101': { pass: '1234', name: 'Alex Cashier', role: 'cashier' },
      'EMP-102': { pass: '1234', name: 'Morgan Manager', role: 'manager' },
      'EMP-103': { pass: '1234', name: 'Taylor Accountant', role: 'accountant' },
      'cashier@store.com': { pass: '1234', name: 'Alex Cashier', role: 'cashier' },
    };

    const found = EMPLOYEES[codeOrEmail.trim()] || EMPLOYEES[codeOrEmail.trim().toUpperCase()];

    if (found && found.pass === pass) {
      const empUser: User = {
        id: `usr-${codeOrEmail}`,
        employee_code: codeOrEmail.trim().toUpperCase(),
        full_name: found.name,
        role: found.role,
      };
      const session: Session = {
        token: `sess-emp-${Date.now()}`,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 Hours
      };

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(empUser));
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

      set({
        user: empUser,
        session,
        isAuthenticated: true,
        activeProject: {
          id: 'proj-101',
          name: 'Hacker Mart General Store',
          slug: 'hacker-mart',
          currency_code: 'USD',
          role: found.role,
        },
      });

      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid Employee Code / Superadmin ID or Password. Try superadmin / admin123 or EMP-101 / 1234.',
    };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
