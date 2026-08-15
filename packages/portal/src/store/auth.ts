// app/store/auth.ts
import { AppStore, AuthSlice } from '@/app/types/state';

export const createAuthSlice = (
  set: (state: Partial<AuthSlice>) => void,
  get: () => AppStore
): AuthSlice => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAccessToken: (t) => set({ accessToken: t }),
  setRefreshToken: (t) => set({ refreshToken: t }),
  setUser: (u) => set({ user: u }),
  logout: async () => {
    // Revogar no servidor ANTES de limpar o estado — é daqui que sai o refresh
    // token, e sem ele a API não sabe que sessão terminar. Chamada direta (e não
    // via `lib/api`) para não criar um ciclo de imports store -> api -> store.
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        /* a sessão local termina de qualquer forma */
      }
    }

    set({ accessToken: null, refreshToken: null, user: null });
    get().clearCompanyContext();
    document.cookie = 'retex_session=; max-age=0; path=/; SameSite=Lax';
    document.cookie = 'sidebar_state=; max-age=0; path=/; SameSite=Strict';
    localStorage.removeItem('app-storage');
    window.location.replace('/auth/login');
  },
});
