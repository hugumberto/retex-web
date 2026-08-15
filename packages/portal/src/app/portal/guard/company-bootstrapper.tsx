// app/portal/guard/company-bootstrapper.tsx
'use client';
import { fetchCompanyContext } from '@/service/company';
import { useAppStore } from '@/store';
import { useEffect } from 'react';

/**
 * Traz o contexto de empresa para o store assim que existe um access token.
 * Monta-se a par do <AuthBootstrapper />, e não dentro dele, porque o contexto
 * depende do token que o bootstrap de auth vai buscar.
 */
export default function CompanyBootstrapper() {
  const accessToken = useAppStore((state) => state.accessToken);
  const setCompanyContext = useAppStore((state) => state.setCompanyContext);
  const clearCompanyContext = useAppStore((state) => state.clearCompanyContext);

  useEffect(() => {
    if (!accessToken) {
      // Sem sessão não há nada a obter, mas o guard não pode ficar à espera para
      // sempre — marca como carregado (a `null`) para ele poder decidir.
      setCompanyContext(null);
      return;
    }

    // Repor `companyContextLoaded` a false antes de revalidar: sem isto, um
    // contexto marcado como carregado numa passagem anterior (ex.: arranque sem
    // token) deixaria o guard decidir com dados vazios enquanto o pedido ainda
    // vai a caminho.
    clearCompanyContext();
    fetchCompanyContext();
  }, [accessToken, clearCompanyContext, setCompanyContext]);

  return null;
}
