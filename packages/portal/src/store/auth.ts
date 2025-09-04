// app/store/auth.ts
import { create } from 'zustand';
import { AuthSlice } from '@/app/types/state';

export const createAuthSlice = (
  set: (state: Partial<AuthSlice>) => void
): AuthSlice => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAccessToken: (t) => set({ accessToken: t }),
  setRefreshToken: (t) => set({ refreshToken: t }),
  setUser: (u) => set({ user: u }),
  logout: async () => {
    set({ accessToken: null, user: null });
    // limpa refresh cookie no servidor
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  },
});
