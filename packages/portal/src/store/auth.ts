// app/store/auth.ts
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
    set({ accessToken: null, refreshToken: null, user: null });
    document.cookie = 'retex_session=; max-age=0; path=/; SameSite=Lax';
    document.cookie = 'sidebar_state=; max-age=0; path=/; SameSite=Strict';
    localStorage.removeItem('app-storage');
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore network errors on logout */ }
    window.location.replace('/auth/login');
  },
});
