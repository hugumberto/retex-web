'use client';

import { Condition, Destination } from '@/app/types/triage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

/**
 * Peças partilhadas pelos dashboards de ADMIN e de cliente. São puras e não
 * sabem de que audiência é o ecrã que as usa — o que muda entre dashboards são
 * os dados, não a forma de os apresentar.
 */

export const CONDITION_COLOR: Record<string, string> = {
  [Condition.EXCELLENT]: '#10b981',
  [Condition.GOOD]: '#84cc16',
  [Condition.REGULAR]: '#f59e0b',
};

export const DESTINATION_COLOR: Record<string, string> = {
  [Destination.REUSE]: '#10b981',
  [Destination.VINTAGE]: '#8b5cf6',
  [Destination.RECONDITIONING]: '#0ea5e9',
  [Destination.UPCYCLING]: '#14b8a6',
  [Destination.STOCK_RESERVE]: '#6366f1',
  [Destination.NON_REUSABLE]: '#dc2626',
  [Destination.ACCESSORY]: '#94a3b8',
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
    <Card className="gap-2 py-4">
      <CardContent className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {hint ? (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
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
