// app/auth/actions.ts
'use client';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';

export async function login(email: string, password: string) {
  const { data } = await api.post(`/auth/login`, { email, password });

  const access = data.access_token;
  if (!access) throw new Error('API não devolveu access_token');
  useAppStore.getState().setAccessToken(access);
  useAppStore.getState().setRefreshToken(data.refresh_token);

  // Opcional: obter user já de seguida
  try {
    useAppStore.getState().setUser(data.user);
  } catch {
    /* empty */
  }
}

export async function bootstrapAuth() {
  // chama refresh logo ao montar a app para obter um access a partir do refresh cookie
  try {
    const { data } = await api.post(`/auth/refresh`, {
      refresh_token: useAppStore.getState().refreshToken,
    });
    if (data) {
      const access = data.access_token ?? data.accessToken ?? null;
      useAppStore.getState().setAccessToken(access);
      if (data.user) {
        useAppStore.getState().setUser(data.user);
      }
    }
  } catch {
    useAppStore.getState().setAccessToken(null);
    useAppStore.getState().setUser(null);
  }
}

export async function resetUserPassword(email: string, password: string) {
  const { status } = await api.put('/user/reset-password', {
    email,
    password,
  });

  if (!isSuccessStatus(status)) {
    throw new Error('Erro ao resetar senha');
  }
}
