'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import StorageUnit from './storage-unit';
import Warehouse from './warehouse';

/**
 * "Receção e armazém" (Figma 11-Admin-Armazém): abre no painel do armazém; a
 * lista de lotes, com criar, editar, imprimir etiqueta e desativar, fica no
 * segundo separador.
 */
export default function StorageUnitPage() {
  const t = useTranslations('warehouse.tabs');
  const [tab, setTab] = useState<'warehouse' | 'lots'>('warehouse');

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-1.5">
        {(['warehouse', 'lots'] as const).map((key) => (
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
            {t(key)}
          </button>
        ))}
      </div>
      {tab === 'warehouse' ? <Warehouse /> : <StorageUnit />}
    </div>
  );
}
