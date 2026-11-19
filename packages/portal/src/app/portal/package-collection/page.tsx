'use client';

import { Role } from '@/app/types/user';
import { getUserRoles } from '@/lib/access-control';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import PackageCollection from './package-collection';
import RoutesDay from './routes-day';

/**
 * ADMIN e OPS abrem na vista do dia (Figma 10-Admin-Rotas); a lista de todas
 * as rotas, com as ações de imprimir, inquérito, estados e edição, fica no
 * segundo separador. O motorista continua só com a lista.
 */
export default function PackageCollectionPage() {
  const t = useTranslations('packageCollection.day');
  const { user } = useAppStore();
  const roles = getUserRoles(user);
  const canPlan = roles.includes(Role.ADMIN) || roles.includes(Role.OPS);
  const [tab, setTab] = useState<'day' | 'all'>('day');

  if (!canPlan) return <PackageCollection />;

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-1.5">
        {(['day', 'all'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex h-[34px] items-center rounded-full border border-navy px-3.5 text-[13px] font-medium',
              tab === key ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-panel'
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>
      {tab === 'day' ? <RoutesDay /> : <PackageCollection />}
    </div>
  );
}
