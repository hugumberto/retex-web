import { useAppStore } from "@/store";
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // envia/recebe cookie de refresh da API externa
});

declare module "axios" {
  // marca interna para evitar loop
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const queue: Array<() => void> = [];
const subscribe = (cb: () => void) => queue.push(cb);
const flush = () => queue.splice(0).forEach((cb) => cb());

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? data.accessToken ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
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

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
          .then((newToken) => {
            useAppStore.getState().setAccessToken(newToken);
            return newToken;
          })
          .finally(() => {
            isRefreshing = false;
            flush();
            refreshPromise = null;
          });
      }

      await new Promise<void>((resolve) => subscribe(resolve));
      const newToken =
        (await refreshPromise) ?? useAppStore.getState().accessToken;

      if (!newToken) {
        await useAppStore.getState().logout();
        throw err;
      }

      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${newToken}`;
      return api(config);
    }

    throw err;
  }
);

export default api;
