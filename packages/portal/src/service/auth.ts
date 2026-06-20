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
  document.cookie = 'retex_session=1; max-age=86400; path=/; SameSite=Lax';

  // Opcional: obter user já de seguida
  try {
    useAppStore.getState().setUser(data.user);
  } catch {
    /* empty */
  }
}

export async function bootstrapAuth() {
  // chama refresh logo ao montar a app para obter um access a partir do refresh token
  const refreshToken = useAppStore.getState().refreshToken;
  if (!refreshToken) return; // sem sessão guardada — nada a fazer
  try {
    const { data } = await api.post(`/auth/refresh`, {
      refresh_token: refreshToken,
    });
    if (data) {
      const access = data.access_token ?? data.accessToken ?? null;
      useAppStore.getState().setAccessToken(access);
      // Guardar o refresh token rotacionado (o backend revoga o anterior).
      const newRefresh = data.refresh_token ?? data.refreshToken ?? null;
      if (newRefresh) useAppStore.getState().setRefreshToken(newRefresh);
      if (data.user) {
        useAppStore.getState().setUser(data.user);
      }
    }
  } catch {
    useAppStore.getState().setAccessToken(null);
    useAppStore.getState().setUser(null);
  }
}

export async function activateUser(token: string, password: string) {
  const { status } = await api.post('/user/activate', { token, password });
  if (!isSuccessStatus(status)) {
    throw new Error('Erro ao ativar conta');
  }
}

export async function forgotPassword(email: string) {
  const { status } = await api.post('/user/forgot-password', { email });
  if (!isSuccessStatus(status)) {
    throw new Error('Erro ao pedir reposição de senha');
  }
}

export async function resetPasswordWithToken(token: string, password: string) {
  const { status } = await api.post('/user/reset-password', { token, password });
  if (!isSuccessStatus(status)) {
    throw new Error('Erro ao repor a senha');
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
