// app/(private)/Protected.tsx
'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { canAccessPath, getFirstAllowedPortalPath } from '@/lib/access-control';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAppStore();
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // aguarda um tick para o bootstrap tentar obter token
    const t = setTimeout(() => {
      if (!accessToken) {
        router.replace('/auth/login');
        setChecking(false);
        return;
      }

      if (!canAccessPath(pathname, user)) {
        router.replace(getFirstAllowedPortalPath(user));
        setChecking(false);
        return;
      }

      setChecking(false);
    }, 200);
    return () => clearTimeout(t);
  }, [accessToken, pathname, router, user]);

  if (checking) return null; // ou skeleton
  return <>{children}</>;
}
