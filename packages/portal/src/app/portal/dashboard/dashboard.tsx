'use client';

import { useTranslations } from 'next-intl';
import { DashboardStatsDTO } from '@/app/types/dashboard';
import { CollectionRequestStatus, Quality } from '@/app/types/collection-request';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAppStore } from '@/store';
import {
  Boxes,
  Droplets,
  Leaf,
  MapPinOff,
  Package,
  Recycle,
  Scale,
  Users,
  UserCheck,
} from 'lucide-react';
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

const QUALITY_COLOR: Record<string, string> = {
  [Quality.GOOD]: '#10b981',
  [Quality.MEDIUM]: '#f59e0b',
  [Quality.BAD]: '#dc2626',
};

const numberFmt = new Intl.NumberFormat('pt-PT');
const fmt = (value: number) => numberFmt.format(value);

function KpiCard({
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

function ChartCard({
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

function DashboardSkeleton() {
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

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tQuality = useTranslations('enums.quality');
  const tSeason = useTranslations('enums.season');
  const tItemType = useTranslations('enums.itemType');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get<DashboardStatsDTO>('/dashboard/stats');
      setStats(data);
    } catch {
      setError(true);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([]);
    fetchStats();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, fetchStats]);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          {t('indicatorsError')}
        </p>
        <button
          onClick={fetchStats}
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const { collectionRequests, triage, environment, users, outOfZone } = stats;

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

  const brandData = triage.byBrand
    .slice(0, 8)
    .map((row) => ({ label: row.brand, value: row.quantity }));

  const trendData = collectionRequests.trend.map((row) => ({
    label: row.period,
    weight: row.weightKg,
  }));

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t('pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Package} label={t('totalRequests')} value={fmt(collectionRequests.total)} />
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
        <KpiCard icon={Users} label={t('users')} value={fmt(users.total)} />
        <KpiCard
          icon={UserCheck}
          label={t('activeUsers')}
          value={fmt(users.active)}
          hint={`${fmt(users.statusActive)} contas ativas`}
        />
        <KpiCard
          icon={MapPinOff}
          label={t('outOfZoneRequests')}
          value={fmt(outOfZone.totalCollectionRequests)}
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
        <p className="mt-2 text-xs text-muted-foreground">
          {t('impactHelp')}
        </p>
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
                label={(d) => d.label}
              >
                {qualityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('topBrands')}
          description={t('itemsPerBrand')}
          isEmpty={brandData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={brandData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('itemsPerSeason')}
          isEmpty={seasonData.length === 0}
        >
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

      {/* Cidades fora da zona */}
      <Card>
        <CardHeader>
          <CardTitle>{t('citiesOutOfZone')}</CardTitle>
          <CardDescription>
            {t('citiesOutOfZoneHelp')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outOfZone.topCities.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('city')}</TableHead>
                  <TableHead className="text-right">{t('requests')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outOfZone.topCities.map((city) => (
                  <TableRow key={city.city}>
                    <TableCell>{city.city}</TableCell>
                    <TableCell className="text-right">{fmt(city.count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
