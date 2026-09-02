'use client';

import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

export interface Pagination<T> {
  /** Os registos da página atual. */
  items: T[];
  page: number;
  totalPages: number;
  goToPrevious: () => void;
  goToNext: () => void;
}

/**
 * Paginação do lado do cliente, sobre uma lista já carregada (e já filtrada).
 *
 * É deliberadamente do lado do cliente: estes ecrãs filtram em memória e a
 * troca de filtro é imediata: passar a paginação para o servidor obrigaria a
 * mandar cada filtro com ela e perder-se-ia isso. Vale enquanto as listas
 * couberem num pedido; quando alguma deixar de caber, é essa lista que muda de
 * estratégia, não este hook.
 *
 * @param resetKey identidade dos filtros do ecrã. Quando muda, volta à primeira
 * página — senão um filtro que reduz a lista deixava o utilizador numa página
 * que já não corresponde ao que ele pediu.
 */
export function usePagination<T>(
  items: T[],
  resetKey?: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Pagination<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // Eliminar registos pode encolher a lista abaixo da página em que se está.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    items: pageItems,
    page,
    totalPages,
    goToPrevious: () => setPage((current) => Math.max(1, current - 1)),
    goToNext: () => setPage((current) => Math.min(totalPages, current + 1)),
  };
}
