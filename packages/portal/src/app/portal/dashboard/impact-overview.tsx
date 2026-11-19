'use client';

import { CollectionRequestStatus } from '@/app/types/collection-request';
import { DashboardStatsDTO } from '@/app/types/dashboard';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ReactNode, useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

/** Período do dashboard (Figma 09-Admin-Dashboard). */
export type Period = 'month' | 'quarter' | 'ytd';

export const periodRange = (period: Period, now = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const start =
    period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === 'quarter'
        ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        : new Date(now.getFullYear(), 0, 1);
  return { from: iso(start), to: iso(now), start };
};

// Agrupamento dos destinos da triagem nos quatro do design (sem "Eliminado":
// a triagem não o distingue; os acessórios não são têxtil recolhido).
const DESTINATION_GROUPS = {
  reuse: ['REUSE', 'VINTAGE', 'RECONDITIONING', 'STOCK_RESERVE'],
  recycling: ['NON_REUSABLE'],
  upcycling: ['UPCYCLING'],
} as const;
const GROUP_COLOR = { reuse: '#02748e', recycling: '#2d5a4e', upcycling: '#5fa8bc' };
const COMPLETED: string[] = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_TRANSIT,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
  CollectionRequestStatus.STOCKED,
];

export type DashboardAlert = { tone: 'warning' | 'info'; title: string; body: string; href?: string };

export function Card({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-2xl border border-line-soft bg-white p-[22px]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-navy">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-2xl px-5 py-[18px]',
        highlight ? 'bg-forest text-white' : 'border border-line-soft bg-white text-navy'
      )}
    >
      <p className={cn('text-[13px]', highlight ? 'text-white/85' : 'text-ink')}>{label}</p>
      <p className="flex items-baseline gap-1 font-bold">
        <span className="text-[32px] tracking-[-0.02em]">{value}</span>
        {unit ? <span className="text-base">{unit}</span> : null}
      </p>
      {hint ? (
        <p className={cn('font-mono text-xs', highlight ? 'text-white/85' : 'text-ink')}>{hint}</p>
      ) : null}
    </div>
  );
}

function BarRows({
  rows,
  color,
  firstColor,
}: {
  rows: { label: string; value: number; display: string }[];
  color: string;
  firstColor?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <li key={row.label} className="flex items-center gap-3 text-[13px] text-navy">
          <span className="w-[110px] shrink-0 truncate" title={row.label}>
            {row.label}
          </span>
          <span className="h-2.5 min-w-0 flex-1">
            <span
              className="block h-2.5 rounded-[2px]"
              style={{
                width: `${Math.max(2, (row.value / max) * 100)}%`,
                background: index === 0 && firstColor ? firstColor : color,
              }}
            />
          </span>
          <span className="w-12 shrink-0 text-right font-mono text-xs">{row.display}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ImpactOverview({
  stats,
  period,
  alerts,
}: {
  stats: DashboardStatsDTO;
  period: Period;
  alerts: DashboardAlert[];
}) {
  const t = useTranslations('dashboard.impact');
  const locale = useLocale();
  const n = (value: number, digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const weight = (kg: number) =>
    kg >= 1000 ? { value: n(kg / 1000, 1), unit: 't' } : { value: n(kg), unit: 'kg' };

  const { collectionRequests: cr, triage, environment } = stats;
  const { start } = periodRange(period);
  const monthLabel = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
  const periodLabel =
    period === 'month'
      ? monthLabel(start)
      : `${monthLabel(start)}–${monthLabel(new Date())}`;

  const destination = useMemo(() => {
    const byKey = new Map(triage.byDestination.map((d) => [d.key, d.quantity]));
    const groups = (Object.keys(DESTINATION_GROUPS) as (keyof typeof DESTINATION_GROUPS)[]).map(
      (key) => ({
        key,
        value: DESTINATION_GROUPS[key].reduce((acc, k) => acc + (byKey.get(k) ?? 0), 0),
      })
    );
    const total = groups.reduce((acc, g) => acc + g.value, 0);
    return { groups, total };
  }, [triage.byDestination]);

  const pieces = destination.total;
  const groupValue = (key: keyof typeof DESTINATION_GROUPS) =>
    destination.groups.find((g) => g.key === key)?.value ?? 0;
  const valorised =
    pieces > 0 ? ((groupValue('reuse') + groupValue('upcycling')) / pieces) * 100 : null;
  const completed = cr.byStatus
    .filter((s) => COMPLETED.includes(s.status))
    .reduce((acc, s) => acc + s.count, 0);

  // Um ponto por mês do período, mesmo sem recolhas.
  const months = useMemo(() => {
    const byPeriod = new Map(cr.trend.map((p) => [p.period, p.weightKg]));
    const list: { label: string; tons: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const now = new Date();
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      list.push({ label: monthLabel(cursor), tons: (byPeriod.get(key) ?? 0) / 1000 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cr.trend, period, locale]);
  const average = months.length
    ? months.reduce((acc, m) => acc + m.tons, 0) / months.length
    : 0;

  const totalWeight = weight(cr.totalWeightKg);
  const co2 = weight(environment.co2AvoidedKg);
  const cities = cr.byCity ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          highlight
          label={t('kpi.collected')}
          value={totalWeight.value}
          unit={totalWeight.unit}
          hint={periodLabel}
        />
        <Kpi
          label={t('kpi.pieces')}
          value={n(pieces)}
          hint={
            cr.totalWeightKg > 0
              ? t('kpi.piecesPerKg', { value: n(pieces / cr.totalWeightKg, 1) })
              : undefined
          }
        />
        <Kpi
          label={t('kpi.valorisation')}
          value={valorised === null ? '—' : `${n(valorised)}%`}
          hint={t('kpi.valorisationHint')}
        />
        <Kpi
          label={t('kpi.completed')}
          value={n(completed)}
          hint={
            completed > 0
              ? t('kpi.kgPerRequest', { value: n(cr.totalWeightKg / completed, 1) })
              : undefined
          }
        />
        <Kpi
          label={t('kpi.co2')}
          value={co2.value}
          unit={co2.unit}
          hint={t('kpi.co2Factor', { factor: n(environment.factors.co2KgPerKg, 1) })}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_426px]">
        <Card
          title={t('monthly.title')}
          aside={
            <span className="font-mono text-[11px] text-ink">
              {t('monthly.average', { value: n(average, 2) })}
            </span>
          }
        >
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: '#e4eef0' }}
                  tick={{ fontSize: 10, fill: '#4a6070', fontFamily: 'var(--font-dm-mono)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => (v === 0 ? '0' : `${n(v, 1)} t`)}
                  tick={{ fontSize: 10, fill: '#4a6070', fontFamily: 'var(--font-dm-mono)' }}
                />
                <ReferenceLine y={average} stroke="#4a6070" strokeDasharray="4 4" />
                <Bar dataKey="tons" radius={[3, 3, 0, 0]} maxBarSize={36}>
                  {months.map((m, i) => (
                    <Cell key={m.label} fill={i === months.length - 1 ? '#013364' : '#02748e'} />
                  ))}
                  <LabelList
                    dataKey="tons"
                    position="top"
                    content={({ x, y, width, index, value }) =>
                      index === months.length - 1 && Number(value) > 0 ? (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 6}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={700}
                          fill="#013364"
                        >
                          {n(Number(value), 1)}
                        </text>
                      ) : null
                    }
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('destination.title')}>
          {destination.total === 0 ? (
            <p className="py-10 text-center text-sm text-ink">{t('empty')}</p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative size-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={destination.groups.filter((g) => g.value > 0)}
                      dataKey="value"
                      nameKey="key"
                      innerRadius={44}
                      outerRadius={75}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {destination.groups
                        .filter((g) => g.value > 0)
                        .map((g) => (
                          <Cell key={g.key} fill={GROUP_COLOR[g.key]} />
                        ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-bold text-navy">100%</span>
                  <span className="text-[10px] text-ink">{t('destination.outOfLandfill')}</span>
                </div>
              </div>
              <ul className="flex min-w-0 flex-1 flex-col gap-3">
                {destination.groups.map((g) => (
                  <li key={g.key} className="flex items-center gap-2 text-[13px] text-navy">
                    <span
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ background: GROUP_COLOR[g.key] }}
                    />
                    <span className="flex-1">{t(`destination.${g.key}`)}</span>
                    <span className="font-mono text-xs">
                      {n((g.value / destination.total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title={t('cities.title')}
          aside={
            <Link
              href="/portal/package-collection"
              className="text-[13px] font-semibold text-navy underline underline-offset-2"
            >
              {t('cities.mapLink')}
            </Link>
          }
        >
          {cities.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink">{t('empty')}</p>
          ) : (
            <BarRows
              rows={cities.slice(0, 8).map((c) => ({
                label: c.city,
                value: c.weightKg,
                display: n(c.weightKg / 1000, 1),
              }))}
              color="#02748e"
              firstColor="#013364"
            />
          )}
          <p className="text-[11px] text-ink">{t('cities.footer', { count: cities.length })}</p>
        </Card>

        <Card
          title={t('brands.title')}
          aside={<span className="font-mono text-[11px] text-ink">{t('brands.unit')}</span>}
        >
          {triage.byBrand.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink">{t('empty')}</p>
          ) : (
            <BarRows
              rows={[...triage.byBrand]
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 7)
                .map((b) => ({ label: b.brand, value: b.quantity, display: n(b.quantity) }))}
              color="#8fc3d0"
            />
          )}
          <p className="text-[11px] text-ink">{t('brands.footer')}</p>
        </Card>
      </div>

      <Card title={t('alerts.title')}>
        {alerts.length === 0 ? (
          <p className="text-sm text-ink">{t('alerts.none')}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {alerts.map((alert) => (
              <li key={alert.title} className="flex items-start gap-2.5 text-[13px]">
                <span
                  className={cn(
                    'mt-1.5 size-[7px] shrink-0 rounded-full',
                    alert.tone === 'warning' ? 'bg-red-700' : 'bg-teal'
                  )}
                />
                <span className="flex flex-col gap-0.5">
                  {alert.href ? (
                    <Link href={alert.href} className="font-bold text-navy hover:underline">
                      {alert.title}
                    </Link>
                  ) : (
                    <span className="font-bold text-navy">{alert.title}</span>
                  )}
                  <span className="text-ink">{alert.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
