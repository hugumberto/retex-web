'use client';
import { CompanyContextDTO } from '@/app/types/company';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';

/**
 * Obtém o contexto de empresa do utilizador autenticado (GET /company/me) e
 * guarda-o no store.
 *
 * A API devolve 200 com corpo `null` quando o utilizador não é membro ativo de
 * uma empresa — não é um erro, é a resposta normal para um particular. Qualquer
 * falha (403, rede, sessão expirada) é tratada da mesma forma: sem contexto. O
 * que importa é marcar `companyContextLoaded`, porque é isso que destranca o
 * guard das rotas de empresa.
 */
export async function fetchCompanyContext(): Promise<CompanyContextDTO | null> {
  const { setCompanyContext } = useAppStore.getState();

  try {
    const { data, status } = await api.get<CompanyContextDTO | null>(
      '/company/me'
    );
    const context = isSuccessStatus(status) && data ? data : null;
    setCompanyContext(context);
    return context;
  } catch {
    setCompanyContext(null);
    return null;
  }
}
