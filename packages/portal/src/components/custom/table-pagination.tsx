'use client';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/hooks/use-pagination';
import { useTranslations } from 'next-intl';

/**
 * Rodapé de paginação das tabelas. Não se desenha quando tudo cabe numa página:
 * repetir "Página 1 de 1" em cada ecrã é ruído.
 */
export default function TablePagination<T>({
  pagination,
}: {
  pagination: Pagination<T>;
}) {
  const t = useTranslations('common');
  const { page, totalPages, goToPrevious, goToNext } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        {t('pageInfo', { current: page, total: totalPages })}
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={page === 1}
        >
          {t('previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={page === totalPages}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
