// app/auth/actions.ts
'use client';
import api, { refreshAccessToken } from '@/lib/api';
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
  // Chama refresh logo ao montar a app para obter um access a partir do refresh
  // token. Usa o mesmo single-flight do interceptor: se já houver um refresh em
  // curso (ex.: um pedido de dados que tomou 401, ou um segundo mount em
  // StrictMode), reusa a mesma promise em vez de gastar o token uma 2ª vez.
  const refreshToken = useAppStore.getState().refreshToken;
  if (!refreshToken) return; // sem sessão guardada — nada a fazer

  const access = await refreshAccessToken();
  if (!access) {
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

/**
 * Envia ao utilizador um email de ativação para ele (re)definir a própria senha
 * (admin). A conta fica inativa até o utilizador concluir a ativação pelo link.
 */
export async function sendActivationEmail(email: string) {
  const { status } = await api.post('/user/send-activation', { email });
  if (!isSuccessStatus(status)) {
    throw new Error('Erro ao enviar email de ativação');
  }
}
