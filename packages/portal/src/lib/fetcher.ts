// lib/fetcher.ts

import { login } from '@/service/auth';
import { useAuthStore } from '@/store/auth';

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retry = true
) {
  let token = useAuthStore.getState().token;
  if (!token) {
    await login();
    token = useAuthStore.getState().token;
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!res.ok) {
    if (res.status === 401 && retry) {
      await login();
      token = useAuthStore.getState().token;
      return fetchWithAuth(url, options, false);
    }
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res;
}
