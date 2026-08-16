'use client';

import { CollectionRequestStatus } from '@/app/types/collection-request';
import { ScopedDashboardStatsDTO } from '@/app/types/dashboard';
import {
  ChartCard,
  DashboardSkeleton,
  KpiCard,
  QUALITY_COLOR,
  fmt,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { STATUS_COLOR } from '@/lib/collection-request-status';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Boxes, Droplets, Leaf, MapPin, Package, Recycle, Scale, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

/**
 * Dashboard do próprio cliente — empresa ou particular.
 *
 * A API decide o âmbito a partir do token; aqui só se distingue os dois casos
 * para mostrar o nome da empresa e a repartição, que não fazem sentido para um
 * particular.
 */
export default function ScopedDashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tQuality = useTranslations('enums.quality');
  const tSeason = useTranslations('enums.season');
  const tItemType = useTranslations('enums.itemType');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [stats, setStats] = useState<ScopedDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, status } = await api.get<ScopedDashboardStatsDTO>(
        '/dashboard/me'
      );
      if (!isSuccessStatus(status)) throw new Error();
      setStats(data);
    } catch {
      setError(true);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/dashboard' }]);
    fetchStats();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStats]);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">{t('indicatorsError')}</p>
        <Button variant="outline" onClick={fetchStats}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  const { scope, company, collectionRequests, triage, environment, breakdown } =
    stats;
  const isCompany = scope === 'COMPANY';

  const statusData = collectionRequests.byStatus.map((row) => ({
    label: tStatus(row.status),
    count: row.count,
    color: STATUS_COLOR[row.status as CollectionRequestStatus] ?? '#64748b',
  }));

  const qualityData = triage.byQuality.map((row) => ({
    label: tQuality(row.key),
    value: row.quantity,
    color: QUALITY_COLOR[row.key] ?? '#64748b',
  }));

  const seasonData = triage.bySeason.map((row) => ({
    label: tSeason(row.key),
    value: row.quantity,
  }));

  const typeData = triage.byType.map((row) => ({
    label: tItemType(row.key),
    value: row.quantity,
  }));

  const trendData = collectionRequests.trend.map((row) => ({
    label: row.period,
    weight: row.weightKg,
  }));

  return (
    <section id="scoped-dashboard" className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {isCompany ? company?.name : t('pageTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isCompany ? t('companySubtitle') : t('personalSubtitle')}
        </p>
      </div>

      {/* KPIs de recolhas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label={t('totalRequests')}
          value={fmt(collectionRequests.total)}
        />
        <KpiCard
          icon={Scale}
          label={t('totalWeight')}
          value={fmt(collectionRequests.totalWeightKg)}
        />
        <KpiCard
          icon={Boxes}
          label={t('bagsEstimatedCollected')}
          value={`${fmt(collectionRequests.totalEstimatedBags)} / ${fmt(
            collectionRequests.totalCollectedBags
          )}`}
        />
        <KpiCard
          icon={Recycle}
          label={t('totalTriagedItems')}
          value={fmt(triage.totalItems)}
        />
      </div>

      {/* Impacto ambiental */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-secondary">
          {t('environmentalImpact')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={Recycle}
            label={t('divertedFromLandfill')}
            value={fmt(environment.landfillDivertedKg)}
          />
          <KpiCard
            icon={Leaf}
            label={t('co2Avoided')}
            value={fmt(environment.co2AvoidedKg)}
            hint={`${environment.factors.co2KgPerKg} kg CO₂/kg`}
          />
          <KpiCard
            icon={Droplets}
            label={t('waterSaved')}
            value={fmt(environment.waterSavedLiters)}
            hint={`${fmt(environment.factors.waterLitersPerKg)} L/kg`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('impactHelp')}</p>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t('requestsByStatus')}
          isEmpty={statusData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ left: -16 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('weightTrend')}
          description={t('lastTwelveMonths')}
          isEmpty={trendData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -16 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('itemQuality')}
          description={t('quantityPerQuality')}
          isEmpty={qualityData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={qualityData}
                dataKey="value"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                label={(d: { label: string }) => d.label}
              >
                {qualityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('itemsPerSeason')} isEmpty={seasonData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seasonData} margin={{ left: -16 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('itemType')} isEmpty={typeData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} margin={{ left: -16 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Repartição da empresa: quem pediu e de onde */}
      {isCompany && breakdown ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownTable
            icon={Users}
            title={t('breakdownByMember')}
            firstColumn={t('member')}
            rows={breakdown.byMember}
            emptyLabel={t('noData')}
            countLabel={t('requests')}
            weightLabel={tCommon('weightKg')}
          />
          <BreakdownTable
            icon={MapPin}
            title={t('breakdownByAddress')}
            firstColumn={t('collectionSite')}
            rows={breakdown.byAddress}
            emptyLabel={t('noData')}
            countLabel={t('requests')}
            weightLabel={tCommon('weightKg')}
          />
        </div>
      ) : null}
    </section>
  );
}

function BreakdownTable({
  icon: Icon,
  title,
  firstColumn,
  rows,
  emptyLabel,
  countLabel,
  weightLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  firstColumn: string;
  rows: { id: string; label: string; count: number; weightKg: number }[];
  emptyLabel: string;
  countLabel: string;
  weightLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{firstColumn}</TableHead>
              <TableHead className="text-right">{countLabel}</TableHead>
              <TableHead className="text-right">{weightLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.label || '-'}</TableCell>
                  <TableCell className="text-right">{fmt(row.count)}</TableCell>
                  <TableCell className="text-right">
                    {fmt(row.weightKg)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
