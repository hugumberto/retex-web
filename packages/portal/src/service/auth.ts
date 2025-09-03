import { useAuthStore } from '@/store/auth';

export const login = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: 'admin@retex.pt', password: '123456' }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  useAuthStore.getState().setToken(data.access_token);
};
