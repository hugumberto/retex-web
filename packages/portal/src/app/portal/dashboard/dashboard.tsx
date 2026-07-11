'use client';

import { DashboardStatsDTO } from '@/app/types/dashboard';
import { PackageStatus, Quality, Season, Type } from '@/app/types/package';
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
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/package-status';
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

const QUALITY_LABEL: Record<string, string> = {
  [Quality.GOOD]: 'Boa',
  [Quality.MEDIUM]: 'Média',
  [Quality.BAD]: 'Má',
};

const QUALITY_COLOR: Record<string, string> = {
  [Quality.GOOD]: '#10b981',
  [Quality.MEDIUM]: '#f59e0b',
  [Quality.BAD]: '#dc2626',
};

const SEASON_LABEL: Record<string, string> = {
  [Season.SUMMER]: 'Verão',
  [Season.WINTER]: 'Inverno',
};

const TYPE_LABEL: Record<string, string> = {
  [Type.UPPER_PART]: 'Parte de cima',
  [Type.UNDER_PART]: 'Parte de baixo',
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sem dados
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
      toast.error('Não foi possível carregar o dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageTitle('Dashboard');
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
          Não foi possível carregar os indicadores.
        </p>
        <button
          onClick={fetchStats}
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { packages, triage, environment, users, outOfZone } = stats;

  const statusData = packages.byStatus.map((row) => ({
    label: STATUS_LABEL[row.status] ?? row.status,
    count: row.count,
    color: STATUS_COLOR[row.status as PackageStatus] ?? '#64748b',
  }));

  const qualityData = triage.byQuality.map((row) => ({
    label: QUALITY_LABEL[row.key] ?? row.key,
    value: row.quantity,
    color: QUALITY_COLOR[row.key] ?? '#64748b',
  }));

  const seasonData = triage.bySeason.map((row) => ({
    label: SEASON_LABEL[row.key] ?? row.key,
    value: row.quantity,
  }));

  const typeData = triage.byType.map((row) => ({
    label: TYPE_LABEL[row.key] ?? row.key,
    value: row.quantity,
  }));

  const brandData = triage.byBrand
    .slice(0, 8)
    .map((row) => ({ label: row.brand, value: row.quantity }));

  const trendData = packages.trend.map((row) => ({
    label: row.period,
    weight: row.weightKg,
  }));

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral de recolhas, triagem, impacto e utilizadores.
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Package} label="Total de Pacotes" value={fmt(packages.total)} />
        <KpiCard
          icon={Scale}
          label="Peso Total (kg)"
          value={fmt(packages.totalWeightKg)}
        />
        <KpiCard
          icon={Boxes}
          label="Volumes Estimados"
          value={fmt(packages.totalVolumes)}
        />
        <KpiCard
          icon={Recycle}
          label="Total de Peças Triadas"
          value={fmt(triage.totalItems)}
        />
        <KpiCard icon={Users} label="Utilizadores" value={fmt(users.total)} />
        <KpiCard
          icon={UserCheck}
          label="Utilizadores Ativos"
          value={fmt(users.active)}
          hint={`${fmt(users.statusActive)} contas ativas`}
        />
        <KpiCard
          icon={MapPinOff}
          label="Pacotes Fora de Zona"
          value={fmt(outOfZone.totalPackages)}
        />
      </div>

      {/* Impacto ambiental */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-secondary">
          Impacto Ambiental
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={Recycle}
            label="Desviado de Aterro (kg)"
            value={fmt(environment.landfillDivertedKg)}
          />
          <KpiCard
            icon={Leaf}
            label="CO₂ Evitado (kg)"
            value={fmt(environment.co2AvoidedKg)}
            hint={`${environment.factors.co2KgPerKg} kg CO₂/kg`}
          />
          <KpiCard
            icon={Droplets}
            label="Água Poupada (L)"
            value={fmt(environment.waterSavedLiters)}
            hint={`${fmt(environment.factors.waterLitersPerKg)} L/kg`}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Estimativas a partir do peso desviado, usando fatores de conversão
          configuráveis.
        </p>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Pacotes por Status"
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
          title="Tendência de Peso Recolhido"
          description="Últimos 12 meses (kg)"
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
          title="Qualidade das peças"
          description="Quantidade por qualidade"
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
          title="Top Marcas"
          description="Quantidade de itens por marca"
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
          title="Peças por estação"
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

        <ChartCard title="Tipo de peça" isEmpty={typeData.length === 0}>
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
          <CardTitle>Cidades Fora da Zona de Atuação</CardTitle>
          <CardDescription>
            Procura por cidades ainda não abrangidas (potencial procura).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outOfZone.topCities.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Sem dados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
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
