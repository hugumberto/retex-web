// lib/fetcher.ts

import { login } from '@/service/auth';
import { useAuthStore } from '@/store/auth';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = useAuthStore.getState().token;
  if (!token) {
    await login();
    token = useAuthStore.getState().token;
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  return res;
}
