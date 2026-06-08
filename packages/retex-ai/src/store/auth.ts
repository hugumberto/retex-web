import { AuthSlice } from '@/app/types/state';

export const createAuthSlice = (
  set: (state: Partial<AuthSlice>) => void,
  get: () => AuthSlice,
): AuthSlice => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setAccessToken: (t) => set({ accessToken: t }),
  setRefreshToken: (t) => set({ refreshToken: t }),
  setUser: (u) => set({ user: u }),
  logout: async () => {
    const token = get().refreshToken;
    set({ accessToken: null, refreshToken: null, user: null });
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: token }),
        });
      } catch { /* ignore logout errors */ }
    }
  },
});
