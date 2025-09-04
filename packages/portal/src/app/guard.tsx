// app/(private)/Protected.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppStore();
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // aguarda um tick para o bootstrap tentar obter token
    const t = setTimeout(() => {
      if (!accessToken) router.replace('/auth/login');
      setChecking(false);
    }, 200);
    return () => clearTimeout(t);
  }, [accessToken, router]);

  if (checking) return null; // ou skeleton
  return <>{children}</>;
}
