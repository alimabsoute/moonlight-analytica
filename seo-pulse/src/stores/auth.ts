import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  plan: 'free' | 'pro' | 'business';
  createdAt: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  setSession: (session) => set({ session }),

  setLoading: (loading) => set({ loading }),

  initialize: () => set({ initialized: true, loading: false }),

  logout: () =>
    set({
      user: null,
      session: null,
      loading: false,
    }),
}));
