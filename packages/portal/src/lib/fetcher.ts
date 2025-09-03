// lib/fetcher.ts

import { login } from '@/service/auth';
import { useAuthStore } from '@/store/auth';

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  retry = true
) {
  const url =`${process.env.NEXT_PUBLIC_API_URL}${path}`
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
      return fetchWithAuth(path, options, false);
    }
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res;
}
