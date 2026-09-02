'use client';

import { Button } from '@/components/ui/button';
import { fetchCompanyContext } from '@/service/company';
import { useAppStore } from '@/store';
import { EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Faixa permanente enquanto o modo "ver como" estiver ativo. Sem ela, um master
 * distraído lê os números de um cliente a pensar que são da operação toda — e é
 * também o único caminho de saída.
 */
export default function ImpersonationBanner() {
  const t = useTranslations('impersonation');
  const impersonatedUser = useAppStore((state) => state.impersonatedUser);
  const stopImpersonation = useAppStore((state) => state.stopImpersonation);
  const clearCompanyContext = useAppStore((state) => state.clearCompanyContext);

  if (!impersonatedUser) return null;

  const handleExit = async () => {
    stopImpersonation();
    clearCompanyContext();
    await fetchCompanyContext();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <span>
        {t('banner', {
          name: `${impersonatedUser.firstName} ${impersonatedUser.lastName}`,
        })}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={handleExit}>
        <EyeOff className="size-4" />
        {t('exit')}
      </Button>
    </div>
  );
}
