'use client';

import { useTranslations } from 'next-intl';
import { DashboardStatsDTO } from '@/app/types/dashboard';
import { CollectionRequestStatus } from '@/app/types/collection-request';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartCard,
  DashboardSkeleton,
  KpiCard,
  CONDITION_COLOR,
  fmt,
} from '@/components/dashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isMaster } from '@/lib/access-control';
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
import ActivityPanel from './activity-panel';
import ImpactOverview, { DashboardAlert, Period, periodRange } from './impact-overview';
import { CollectionRequestDTO } from '@/app/types/collection-request';
import { PackageCollectionDTO } from '@/app/types/package-collection';
import { cn } from '@/lib/utils';
import ViewAsDialog from './view-as-dialog';
import {
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

/** Visão global da operação; continua exclusiva de ADMIN. */
export default function AdminDashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tCondition = useTranslations('enums.condition');
  const tCategory = useTranslations('enums.category');
  const tSeason = useTranslations('enums.season');
  const tItemType = useTranslations('enums.itemType');
  const { user, setPageTitle, setBreadcrumbs } = useAppStore();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Filtros do Figma 09-Admin-Dashboard: período e concelho.
  const [period, setPeriod] = useState<Period>('ytd');
  const [city, setCity] = useState('');
  const [allCities, setAllCities] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { from, to } = periodRange(period);
      const { data } = await api.get<DashboardStatsDTO>('/dashboard/stats', {
        params: { from, to, city: city || undefined },
      });
      setStats(data);
      // A lista de concelhos vem da vista sem filtro de concelho, senão ao
      // escolher um ficava só esse para escolher.
      if (!city) {
        setAllCities(
          (data.collectionRequests.byCity ?? [])
            .map((c) => c.city)
            .sort((a, b) => a.localeCompare(b, 'pt'))
        );
      }
    } catch {
      setError(true);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, city]);

  // Alertas só com o que tem dados: pedidos parados, fora de zona e rotas à
  // espera de confirmação dos clientes.
  const fetchAlerts = useCallback(async () => {
    try {
      const [requestsRes, routesRes] = await Promise.all([
        api.get<{ data: CollectionRequestDTO[] } | CollectionRequestDTO[]>('/collection-request'),
        api.get<{ data: PackageCollectionDTO[] } | PackageCollectionDTO[]>('/route?status=CREATED'),
      ]);
      const requests = Array.isArray(requestsRes.data) ? requestsRes.data : requestsRes.data.data;
      const routes = Array.isArray(routesRes.data) ? routesRes.data : routesRes.data.data;
      const now = Date.now();
      const stale = requests.filter(
        (r) =>
          r.status === CollectionRequestStatus.CREATED &&
          !r.route &&
          r.createdAt &&
          now - new Date(r.createdAt).getTime() > 48 * 3600 * 1000
      );
      const staleCities = [...new Set(stale.map((r) => r.address?.city).filter(Boolean))];
      const outOfZone = requests.filter((r) => r.status === CollectionRequestStatus.OUT_OF_ZONE);
      const list: DashboardAlert[] = [];
      if (stale.length) {
        list.push({
          tone: 'warning',
          title: t('impact.alerts.stale', { count: stale.length }),
          body: t('impact.alerts.staleBody', {
            cities: staleCities.slice(0, 3).join(', '),
            more: Math.max(0, staleCities.length - 3),
          }),
          href: '/portal/collection-request',
        });
      }
      if (routes.length) {
        list.push({
          tone: 'info',
          title: t('impact.alerts.awaiting', { count: routes.length }),
          body: t('impact.alerts.awaitingBody'),
          href: '/portal/package-collection',
        });
      }
      if (outOfZone.length) {
        list.push({
          tone: 'info',
          title: t('impact.alerts.outOfZone', { count: outOfZone.length }),
          body: t('impact.alerts.outOfZoneBody'),
          href: '/portal/collection-request',
        });
      }
      setAlerts(list);
    } catch {
      setAlerts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageTitle(t('impact.title', { year: new Date().getFullYear() }));
    setBreadcrumbs([{ label: city || t('impact.allCities') }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, city, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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

  const conditionData = triage.byCondition.map((row) => ({
    label: (row.key ? tCondition(row.key) : t('notSpecified')),
    value: row.quantity,
    color: CONDITION_COLOR[row.key] ?? '#64748b',
  }));

  // Há muitas categorias: mostra só as mais frequentes, como nas marcas.
  const categoryData = [...triage.byCategory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)
    .map((row) => ({ label: (row.key ? tCategory(row.key) : t('notSpecified')), value: row.quantity }));

  const seasonData = triage.bySeason.map((row) => ({
    label: (row.key ? tSeason(row.key) : t('notSpecified')),
    value: row.quantity,
  }));

  const typeData = triage.byType.map((row) => ({
    label: (row.key ? tItemType(row.key) : t('notSpecified')),
    value: row.quantity,
  }));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-1.5 print:hidden">
        {(['month', 'quarter', 'ytd'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={cn(
              'inline-flex h-[34px] items-center rounded-full border border-navy px-3.5 text-[13px] font-medium',
              period === p ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-panel'
            )}
          >
            {t(`impact.periods.${p}`)}
          </button>
        ))}
        <label className="relative inline-flex h-[34px] items-center rounded-full border border-field bg-white pl-3.5 pr-7 text-[13px] font-medium text-navy">
          <span className="sr-only">{t('impact.cityFilter')}</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent focus:outline-none"
          >
            <option value="">{t('impact.allCities')}</option>
            {allCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-3 text-xs">⌄</span>
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-[34px] items-center rounded-full bg-navy px-4 text-[13px] font-semibold text-white hover:opacity-90"
        >
          {t('impact.export')}
        </button>
        {/* Entrada do modo "ver como" — a API só o permite a um MASTER. */}
        {isMaster(user) && <ViewAsDialog />}
      </div>

      <ImpactOverview stats={stats} period={period} alerts={alerts} />

      <h2 className="mt-4 border-t border-line pt-6 text-lg font-bold text-navy">
        {t('impact.moreIndicators')}
      </h2>

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
          hint={t('activeAccounts', { count: fmt(users.statusActive) })}
        />
        <KpiCard
          icon={MapPinOff}
          label={t('outOfZoneRequests')}
          value={fmt(outOfZone.totalCollectionRequests)}
        />
      </div>

      <ActivityPanel />

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
          title={t('itemCondition')}
          description={t('quantityPerCondition')}
          isEmpty={conditionData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={conditionData}
                dataKey="value"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                label={(d) => d.label}
              >
                {conditionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>



        <ChartCard
          title={t('itemCategory')}
          description={t('quantityPerCategory')}
          isEmpty={categoryData.length === 0}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
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
