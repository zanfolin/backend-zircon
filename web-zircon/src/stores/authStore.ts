import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';

interface AuthState {
  user: Partial<User> | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenIssuedAt: number | null;
  setSession: (payload: {
    user?: Partial<User> | null;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setUser: (user: Partial<User>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenIssuedAt: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set((state) => ({
          user: user !== undefined ? user : state.user,
          accessToken,
          refreshToken,
          tokenIssuedAt: Date.now(),
        })),
      setUser: (user) => set({ user }),
      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenIssuedAt: null,
        }),
    }),
    {
      name: 'zircon-web-auth',
    },
  ),
);
