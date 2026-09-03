'use client';

import { DashboardActivityDTO } from '@/app/types/dashboard';
import { KpiCard, fmt } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { HandHelping, PackageCheck, Recycle, Shirt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Funil do período: quantas solicitações entraram, quantas foram recolhidas,
 * quantas foram triadas e quantas peças isso deu.
 *
 * Cada número tem a sua própria data — uma solicitação de julho pode ser
 * recolhida em agosto e triada em setembro. É por isso que as contagens de um
 * intervalo curto não fecham entre si: cada uma conta o que aconteceu naquele
 * intervalo, não o percurso de um mesmo pedido.
 */
export default function ActivityPanel() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState<DashboardActivityDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString();
      const { data } = await api.get<DashboardActivityDTO>(
        `/dashboard/activity${query ? `?${query}` : ''}`
      );
      setStats(data);
    } catch {
      toast.error(t('activityLoadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const hasFilter = from !== '' || to !== '';

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{t('activityTitle')}</CardTitle>
          <CardDescription>{t('activityDescription')}</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={from}
            // O `max`/`min` cruzados impedem um intervalo invertido, que só
            // devolveria zeros sem explicar porquê.
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            aria-label={t('activityFrom')}
            className="w-40"
          />
          <span className="text-sm text-muted-foreground">—</span>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            aria-label={t('activityTo')}
            className="w-40"
          />
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
            >
              {tCommon('clear')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading || !stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((slot) => (
              <Skeleton key={slot} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={HandHelping}
              label={t('activityRequests')}
              value={fmt(stats.requests)}
            />
            <KpiCard
              icon={PackageCheck}
              label={t('activityCollections')}
              value={fmt(stats.collections)}
            />
            <KpiCard
              icon={Recycle}
              label={t('activityTriages')}
              value={fmt(stats.triages)}
            />
            <KpiCard
              icon={Shirt}
              label={t('activityPieces')}
              value={fmt(stats.pieces)}
            />
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{t('activityHint')}</p>
      </CardContent>
    </Card>
  );
}
