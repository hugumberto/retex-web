'use client';

import { Condition, Destination } from '@/app/types/triage';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

/**
 * Peças partilhadas pelos dashboards de ADMIN e de cliente. São puras e não
 * sabem de que audiência é o ecrã que as usa — o que muda entre dashboards são
 * os dados, não a forma de os apresentar.
 */

export const CONDITION_COLOR: Record<string, string> = {
  [Condition.EXCELLENT]: '#2d5a4e',
  [Condition.GOOD]: '#02748e',
  [Condition.REGULAR]: '#d99a2b',
};

export const DESTINATION_COLOR: Record<string, string> = {
  [Destination.REUSE]: '#02748e',
  [Destination.VINTAGE]: '#013364',
  [Destination.RECONDITIONING]: '#5fa3b3',
  [Destination.UPCYCLING]: '#7fb8c4',
  [Destination.STOCK_RESERVE]: '#4f7fa3',
  [Destination.NON_REUSABLE]: '#2d5a4e',
  [Destination.ACCESSORY]: '#8fb0c4',
};

const numberFmt = new Intl.NumberFormat('pt-PT');
export const fmt = (value: number) => numberFmt.format(value);

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line-soft bg-white px-4 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dceff3] text-teal">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase leading-snug tracking-[0.06em] text-ink">{label}</p>
        <p className="mt-1 text-[26px] font-bold leading-tight text-navy">{value}</p>
        {hint ? <p className="text-xs text-ink">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  description,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard');

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-white p-5">
      <div>
        <h3 className="text-[17px] font-semibold text-navy">{title}</h3>
        {description ? <p className="text-xs text-ink">{description}</p> : null}
      </div>
      {isEmpty ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-ink">{t('noData')}</div>
      ) : (
        children
      )}
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
