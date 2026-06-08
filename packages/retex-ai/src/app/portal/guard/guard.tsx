'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppStore();
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!accessToken) router.replace('/auth/login');
      setChecking(false);
    }, 200);
    return () => clearTimeout(t);
  }, [accessToken, router]);

  if (checking) return null;
  return <>{children}</>;
}
