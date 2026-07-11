import { useAppStore } from '@/store';
import axios, { AxiosError } from 'axios';
import { isSuccessStatus } from './utils';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // envia/recebe cookie de refresh da API externa
});

// Cliente "cru" (sem interceptors) só para o /auth/refresh. Evita que um 401 do
// próprio refresh volte a entrar no interceptor de resposta e cause recursão.
const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

declare module 'axios' {
  // marca interna para evitar loop
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Single-flight: enquanto um refresh estiver em curso, todas as chamadas (o
// interceptor de 401 e o bootstrap ao montar a app) reusam a MESMA promise. Sem
// isto, chamadas concorrentes leem o mesmo refresh token do store e gastam-no
// mais do que uma vez — o backend roda o token (revoga o antigo), por isso o
// segundo pedido recebe 401 "Refresh token inválido".
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = useAppStore.getState().refreshToken;
    if (!refreshToken) return null;
    try {
      const { data, status } = await refreshClient.post(`/auth/refresh`, {
        refresh_token: refreshToken,
      });
      if (!isSuccessStatus(status)) return null;
      // O backend roda o refresh token a cada refresh (revoga o antigo e devolve
      // um novo). É obrigatório guardar o novo, senão o próximo refresh dá 401.
      const newRefresh = data.refresh_token ?? data.refreshToken ?? null;
      if (newRefresh) useAppStore.getState().setRefreshToken(newRefresh);
      const access = data.access_token ?? data.accessToken ?? null;
      useAppStore.getState().setAccessToken(access);
      return access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (
      config.headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const { response, config } = err;
    if (!response || !config) throw err;

    if (response.status === 401 && !config._retry) {
      config._retry = true;

      // Todas as respostas 401 concorrentes esperam pelo mesmo refresh.
      const newToken = await refreshAccessToken();

      if (!newToken) {
        await useAppStore.getState().logout();
        throw err;
      }

      config.headers = config.headers ?? {};
      (
        config.headers as Record<string, string>
      ).Authorization = `Bearer ${newToken}`;
      return api(config);
    }

    throw err;
  }
);

export default api;
