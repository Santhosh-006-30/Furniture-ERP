import { create } from 'zustand';

interface AuthState {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  } | null;
  token: string | null;
  sidebarOpen: boolean;
  setAuth: (user: AuthState['user'], token: string | null) => void;
  clearAuth: () => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  sidebarOpen: true,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('mini_erp_token', token);
        localStorage.setItem('mini_erp_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('mini_erp_token');
        localStorage.removeItem('mini_erp_user');
      }
    }
    set({ user, token });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mini_erp_token');
      localStorage.removeItem('mini_erp_user');
    }
    set({ user: null, token: null });
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}));
