// app/(private)/Protected.tsx
'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  canAccessPath,
  getFirstAllowedPortalPath,
  routeRequiresCompany,
} from '@/lib/access-control';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { accessToken, user, companyContext, companyContextLoaded } = useAppStore();
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

      // Numa rota de empresa, decidir antes de GET /company/me responder seria
      // expulsar o gestor de cada vez que entra por URL direto ou recarrega.
      // Ficar em `checking` é seguro: o efeito volta a correr quando o contexto
      // chegar (companyContextLoaded está nas dependências).
      if (!companyContextLoaded && routeRequiresCompany(pathname)) {
        return;
      }

      if (!canAccessPath(pathname, user, companyContext)) {
        router.replace(getFirstAllowedPortalPath(user, companyContext));
        setChecking(false);
        return;
      }

      setChecking(false);
    }, 200);
    return () => clearTimeout(t);
  }, [accessToken, pathname, router, user, companyContext, companyContextLoaded]);

  if (checking) return null; // ou skeleton
  return <>{children}</>;
}
