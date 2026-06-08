'use client';
import api from '@/lib/api';
import { useAppStore } from '@/store';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  const access = data.access_token;
  if (!access) throw new Error('API não devolveu access_token');
  useAppStore.getState().setAccessToken(access);
  useAppStore.getState().setRefreshToken(data.refresh_token);
  try {
    useAppStore.getState().setUser(data.user);
  } catch { /* empty */ }
}

export async function bootstrapAuth() {
  const refreshToken = useAppStore.getState().refreshToken;
  if (!refreshToken) {
    useAppStore.getState().setAccessToken(null);
    return;
  }
  try {
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
    if (data) {
      const access = data.access_token ?? data.accessToken ?? null;
      useAppStore.getState().setAccessToken(access);
    }
  } catch {
    useAppStore.getState().setAccessToken(null);
    useAppStore.getState().setUser(null);
  }
}
