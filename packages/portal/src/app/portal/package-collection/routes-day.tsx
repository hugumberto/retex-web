'use client';

import {
  CollectionRequestDTO,
  CollectionRequestStatus,
} from '@/app/types/collection-request';
import { CollectionStatus, PackageCollectionDTO } from '@/app/types/package-collection';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { addDays, format } from 'date-fns';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculatePlan,
  clockAfter,
  PlanResult,
  useSystemParameters,
  warehouseOf,
} from '../collection-request/use-route-plan';
import DistrictMap, { BUCKETS, CityInfo, normalizeCity } from './components/district-map';

type DayRoute = PackageCollectionDTO & {
  collectionRequestsCount?: number;
  confirmedCount?: number;
};

const ROUTE_COLORS = ['#013364', '#2d5a4e', '#6a4fb5', '#02748e', '#a5672c', '#4a6070'];
const HOURS_48 = 48 * 3600 * 1000;

// Depois de recolhido, o pedido conta como paragem feita.
const DONE: string[] = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_TRANSIT,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
  CollectionRequestStatus.STOCKED,
];
const isDone = (r: CollectionRequestDTO) => DONE.includes(r.status);
const clientName = (r: CollectionRequestDTO) =>
  r.company?.name ?? (`${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || '—');

const STATUS_BADGE: Record<CollectionStatus, string> = {
  [CollectionStatus.DRAFTING]: 'bg-neutral-badge text-ink',
  [CollectionStatus.CREATED]: 'bg-[#fdf1dc] text-[#8a5a12]',
  [CollectionStatus.WAITING_TO_START]: 'bg-[#dceff3] text-[#02566a]',
  [CollectionStatus.IN_TRANSIT]: 'bg-[#ece6f8] text-[#4b3590]',
  [CollectionStatus.FINISHED]: 'bg-mint text-forest',
};

const unwrap = <T,>(data: { data: T[] } | T[]): T[] => (Array.isArray(data) ? data : data?.data ?? []);

/** Vista "Rotas de hoje" (Figma 10-Admin-Rotas), para ADMIN e OPS. */
export default function RoutesDay() {
  const t = useTranslations('packageCollection.day');
  const locale = useLocale();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const params = useSystemParameters();
  const warehouse = useMemo(() => warehouseOf(params), [params]);

  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [routes, setRoutes] = useState<DayRoute[]>([]);
  const [requests, setRequests] = useState<CollectionRequestDTO[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanResult>>({});
  const [suggestionPlan, setSuggestionPlan] = useState<PlanResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Abre num dia concreto com ?date=YYYY-MM-DD (ligações de outros ecrãs).
  useEffect(() => {
    const day = new URLSearchParams(window.location.search).get('date');
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) setDate(day);
  }, []);

  const n = (value: number, digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));

  useEffect(() => {
    setPageTitle(date === today ? t('titleToday') : t('titleDay', { day: dayLabel }));
    setBreadcrumbs([]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [date, today, dayLabel, setPageTitle, setBreadcrumbs, t]);

  // Só a resposta do pedido mais recente conta: ao mudar de dia depressa, um
  // pedido antigo que chegasse depois apagava as rotas do dia certo.
  const loadId = useRef(0);
  const load = useCallback(async () => {
    const id = ++loadId.current;
    setIsLoading(true);
    try {
      const [routesRes, requestsRes] = await Promise.all([
        api.get<{ data: DayRoute[] } | DayRoute[]>('/route', { params: { date, limit: 100 } }),
        api.get<{ data: CollectionRequestDTO[] } | CollectionRequestDTO[]>('/collection-request'),
      ]);
      const list = unwrap(routesRes.data);
      // A listagem não traz as paragens; o detalhe de cada rota traz.
      const detailed = await Promise.all(
        list.map((route) =>
          api
            .get<PackageCollectionDTO>(`/route/${route.id}`)
            .then(({ data }) => ({ ...route, ...data }))
            .catch(() => route)
        )
      );
      if (id !== loadId.current) return;
      setRoutes(detailed);
      setRequests(unwrap(requestsRes.data));
      setSelectedId((current) =>
        detailed.some((r) => r.id === current)
          ? current
          : (detailed.find((r) => r.status === CollectionStatus.IN_TRANSIT) ?? detailed[0])?.id ?? null
      );
    } catch {
      if (id === loadId.current) setRoutes([]);
    } finally {
      if (id === loadId.current) setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  // Percurso de cada rota (km e horas). Só depois de haver parâmetros.
  useEffect(() => {
    if (!params) return;
    let cancelled = false;
    Promise.all(
      routes.map(async (route) => [route.id, await calculatePlan(route.collectionRequests ?? [], params)] as const)
    ).then((entries) => {
      if (!cancelled) setPlans(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [routes, params]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === CollectionRequestStatus.CREATED && !r.route),
    [requests]
  );

  // kg por saco: média das recolhas já pesadas (peso real / sacos estimados).
  const kgPerBag = useMemo(() => {
    const weighed = requests.filter((r) => Number(r.weight ?? 0) > 0 && (r.estimatedBags ?? 0) > 0);
    const bags = weighed.reduce((acc, r) => acc + (r.estimatedBags ?? 0), 0);
    const kg = weighed.reduce((acc, r) => acc + Number(r.weight ?? 0), 0);
    return bags > 0 ? kg / bags : null;
  }, [requests]);

  const labelled = routes.map((route, index) => {
    const stops = route.collectionRequests ?? [];
    const cities = Object.entries(
      stops.reduce<Record<string, number>>((acc, r) => {
        const city = r.address?.city?.trim();
        if (city) acc[city] = (acc[city] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city);
    return {
      route,
      label: `R${index + 1}`,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      cities,
      stops,
      done: stops.filter(isDone).length,
      bags: stops.reduce((acc, r) => acc + (r.estimatedBags ?? 0), 0),
    };
  });

  // Sugestão: os dois concelhos com mais pedidos pendentes.
  const suggestion = useMemo(() => {
    const byCity = pending.reduce<Record<string, CollectionRequestDTO[]>>((acc, r) => {
      const city = r.address?.city?.trim();
      if (city) (acc[city] ??= []).push(r);
      return acc;
    }, {});
    const top = Object.entries(byCity)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 2);
    if (top.length === 0) return null;
    const selected = top.flatMap(([, list]) => list).slice(0, 15);
    const stale = selected.filter(
      (r) => r.createdAt && Date.now() - new Date(r.createdAt).getTime() > HOURS_48
    ).length;
    return { cities: top.map(([city]) => city), requests: selected, stale };
  }, [pending]);

  const suggestionKey = suggestion?.requests.map((r) => r.id).join(',') ?? '';
  useEffect(() => {
    if (!suggestion || !params) {
      setSuggestionPlan(null);
      return;
    }
    let cancelled = false;
    calculatePlan(suggestion.requests, params).then((plan) => {
      if (!cancelled) setSuggestionPlan(plan);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionKey, params]);

  const byCity = useMemo(() => {
    const map = new Map<string, CityInfo>();
    const entry = (city?: string | null) => {
      const key = normalizeCity(city);
      if (!map.has(key)) map.set(key, { pending: 0, stale: false, routes: [] });
      return map.get(key) as CityInfo;
    };
    pending.forEach((r) => {
      const info = entry(r.address?.city);
      info.pending += 1;
      if (r.createdAt && Date.now() - new Date(r.createdAt).getTime() > HOURS_48) info.stale = true;
    });
    labelled.forEach(({ label, stops }) => {
      stops.forEach((r) => {
        const info = entry(r.address?.city);
        if (!info.routes.includes(label)) info.routes.push(label);
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, routes]);

  const totalStops = labelled.reduce((acc, r) => acc + r.stops.length, 0);
  const doneStops = labelled.reduce((acc, r) => acc + r.done, 0);
  const totalKm = Object.values(plans).reduce((acc, p) => acc + (p.distanceKm ?? 0), 0);
  const totalBags = labelled.reduce((acc, r) => acc + r.bags, 0);
  const withVehicle = labelled.filter((r) => r.route.vehicle?.capacityBags);
  const occupancy = withVehicle.length
    ? withVehicle.reduce((acc, r) => acc + r.bags / (r.route.vehicle?.capacityBags ?? 1), 0) /
      withVehicle.length
    : null;

  const selected = labelled.find((r) => r.route.id === selectedId) ?? null;
  const selectedPlan = selected ? plans[selected.route.id] : undefined;
  const interval = selected?.route.collectionInterval ?? null;
  const tomorrow = format(addDays(new Date(`${date}T12:00:00`), 1), 'yyyy-MM-dd');

  const statusLabel = (route: DayRoute) =>
    route.status === CollectionStatus.WAITING_TO_START && route.collectionInterval
      ? t('status.scheduledAt', { time: route.collectionInterval.split(' - ')[0] })
      : t(`status.${route.status}`);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setDate(format(addDays(new Date(`${date}T12:00:00`), -1), 'yyyy-MM-dd'))}
          className="inline-flex h-11 items-center rounded-full border border-navy bg-white px-4 text-sm font-semibold text-navy hover:bg-panel"
          aria-label={t('previousDay')}
        >
          ←
        </button>
        <span className="font-mono text-xs text-navy">{dayLabel}</span>
        {date !== today ? (
          <button
            type="button"
            onClick={() => setDate(today)}
            className="inline-flex h-11 items-center rounded-full border border-navy bg-white px-4 text-sm font-semibold text-navy hover:bg-panel"
          >
            {t('today')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDate(tomorrow)}
          className="inline-flex h-11 items-center rounded-full border border-navy bg-white px-[22px] text-sm font-semibold text-navy hover:bg-panel"
        >
          {t('nextDay')} →
        </button>
        <Link
          href="/portal/collection-request"
          className="inline-flex h-11 items-center rounded-full bg-navy px-[22px] text-sm font-semibold text-white hover:opacity-90"
        >
          + {t('newRoute')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: t('kpi.routes'), value: n(routes.length), extra: suggestion ? t('kpi.suggested') : null },
          { label: t('kpi.stops'), value: n(totalStops), extra: t('kpi.done', { count: doneStops }) },
          { label: t('kpi.km'), value: totalKm > 0 ? `${n(totalKm)} km` : '—', extra: null },
          {
            label: t('kpi.kg'),
            value: kgPerBag && totalBags ? `≈ ${n(totalBags * kgPerBag)}` : '—',
            extra: kgPerBag ? null : t('kpi.noHistory'),
          },
          { label: t('kpi.occupancy'), value: occupancy === null ? '—' : `${n(occupancy * 100)}%`, extra: null },
        ].map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-[14px] border border-line-soft bg-white px-[18px] py-3.5">
            <p className="text-[13px] text-ink">{kpi.label}</p>
            <p className="flex items-baseline gap-1.5 text-navy">
              <span className="text-[26px] font-bold tracking-[-0.02em]">{kpi.value}</span>
              {kpi.extra ? <span className="text-[13px]">{kpi.extra}</span> : null}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_428px]">
        <section className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-line-soft bg-white p-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-navy">{t('map.title')}</h2>
            <span className="font-mono text-[10px] text-ink">{t('map.source')}</span>
          </div>
          <DistrictMap byCity={byCity} warehouse={warehouse} />
          <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 text-xs text-ink">
            {BUCKETS.map((b, i) => (
              <li key={b.min} className="flex items-center gap-1.5">
                <span className="size-3 rounded-[2px]" style={{ background: b.fill }} />
                {t(`map.legend.${i}`)}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-[2px] border-[1.2px] border-dashed border-[#a12a1e]" />
              {t('map.stale')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="rounded-full border border-navy px-[5px] font-mono text-[9px] text-navy">R1</span>
              {t('map.route')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-[2px] border-[1.2px] border-navy" />
              {t('map.warehouse')}
            </li>
          </ul>
        </section>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-ink">{t('loading')}</p>
          ) : labelled.length === 0 ? (
            <p className="rounded-xl border border-line-soft bg-white p-6 text-center text-sm text-ink">
              {t('noRoutes')}
            </p>
          ) : (
            labelled.map(({ route, label, color, cities, stops, done }) => {
              const plan = plans[route.id];
              // Rota concluída não tem "próxima"; pedidos cancelados não contam.
              const next =
                route.status === CollectionStatus.FINISHED
                  ? undefined
                  : plan?.stops.find(
                      (s) => !isDone(s.request) && s.request.status !== CollectionRequestStatus.CANCELLED
                    );
              const nextTime =
                next && route.collectionInterval && next.arrivalMinutes !== null
                  ? clockAfter(route.collectionInterval, next.arrivalMinutes)
                  : null;
              const active = route.id === selectedId;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedId(route.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-xl bg-white px-4 py-3.5 text-left',
                    active ? 'border-2 border-navy' : 'border border-line-soft hover:border-slate'
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: color }} />
                      <span className="truncate text-[15px] font-bold text-navy">
                        {label} · {cities.slice(0, 2).join(t('and')) || route.friendlyCode}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-semibold',
                        STATUS_BADGE[route.status]
                      )}
                    >
                      {statusLabel(route)}
                    </span>
                  </span>
                  <span className="text-xs text-ink">
                    {[
                      `${route.driver?.firstName ?? ''} ${route.driver?.lastName ?? ''}`.trim(),
                      route.vehicle?.plate,
                      t('stopsCount', { count: stops.length }),
                      plan?.distanceKm ? `${n(plan.distanceKm)} km` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <span className="h-[5px] w-full overflow-hidden rounded-[3px] bg-line">
                    <span
                      className="block h-full"
                      style={{ width: `${stops.length ? (done / stops.length) * 100 : 0}%`, background: color }}
                    />
                  </span>
                  {done > 0 || next ? (
                    <span className="font-mono text-[10px] text-ink">
                      {t('progress', { done, total: stops.length })}
                      {next
                        ? ` · ${t('next')} ${nextTime ? `${nextTime} ` : ''}${next.request.address?.cityDivision || next.request.address?.city || ''}`
                        : ''}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}

          {suggestion ? (
            <div className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-dashed border-teal bg-[#f2f8f9] px-4 pb-4 pt-3.5">
              <p className="text-[13px] font-bold text-navy">
                {t('suggestion.title', { cities: suggestion.cities.join(t('and')) })}
              </p>
              <p className="text-xs leading-[18px] text-ink">
                {t('suggestion.body', {
                  count: suggestion.requests.length,
                  stale: suggestion.stale,
                })}
                {suggestionPlan?.distanceKm
                  ? ` ${t('suggestion.km', { km: n(suggestionPlan.distanceKm) })}`
                  : ''}
              </p>
              <Link
                href={`/portal/collection-request?select=${suggestion.requests.map((r) => r.id).join(',')}&date=${tomorrow}`}
                className="self-start rounded-full bg-[linear-gradient(to_right,#013364,#02748e)] px-[22px] py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {t('suggestion.cta')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {selected ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_378px]">
          <section className="flex min-w-0 flex-col rounded-2xl border border-line-soft bg-white px-4 py-[22px]">
            <div className="flex items-center justify-between gap-2 px-1.5 pb-3.5">
              <h2 className="text-base font-bold text-navy">
                {t('stops.title', {
                  route: `${selected.label} · ${selected.cities.slice(0, 2).join(t('and')) || selected.route.friendlyCode}`,
                })}
              </h2>
              <span className="font-mono text-[11px] text-ink">
                {t('progress', { done: selected.done, total: selected.stops.length })}
              </span>
            </div>
            <div className="flex items-center gap-3.5 py-2.5 pl-1.5 text-[13px] text-ink">
              <span className="size-6 shrink-0 rounded-md border-[1.5px] border-navy" />
              <span>
                {t('stops.departure')}{' '}
                <span className="font-mono text-navy">{interval ? interval.split(' - ')[0] : '—'}</span>
              </span>
            </div>
            <ol>
              {(selectedPlan?.stops ?? selected.stops.map((request) => ({ request, arrivalMinutes: null }))).map(
                ({ request, arrivalMinutes }, index, all) => {
                  const done = isDone(request);
                  const cancelled = request.status === CollectionRequestStatus.CANCELLED;
                  const isNext = !done && !cancelled && all.findIndex((s) => !isDone(s.request) && s.request.status !== CollectionRequestStatus.CANCELLED) === index;
                  const time = interval && arrivalMinutes !== null ? clockAfter(interval, arrivalMinutes) : null;
                  return (
                    <li
                      key={request.id}
                      className={cn('flex gap-3.5 rounded-lg pl-1.5 pr-2.5', isNext && 'bg-row-selected')}
                    >
                      <span className="flex w-6 shrink-0 flex-col items-center pt-2.5">
                        <span
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full text-[11px]',
                            done
                              ? 'bg-forest text-white'
                              : isNext
                                ? 'border-[3px] border-sky bg-navy font-semibold text-white'
                                : 'border-[1.5px] border-field bg-white text-ink'
                          )}
                        >
                          {done ? <Check className="size-3.5" /> : index + 1}
                        </span>
                        {index < all.length - 1 ? (
                          <span className={cn('w-0.5 flex-1', done ? 'bg-navy' : 'bg-field')} />
                        ) : null}
                      </span>
                      <span className="w-[46px] shrink-0 pt-3.5 font-mono text-xs text-ink">{time ?? '—'}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-[3px] pb-3.5 pt-2.5">
                        <span className="truncate text-sm font-bold text-navy">{clientName(request)}</span>
                        <span className="truncate text-xs text-ink">
                          {[
                            request.address?.cityDivision || request.address?.city,
                            t('bags', { count: request.estimatedBags ?? 0 }),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <span className="shrink-0 pt-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-[3px] text-[11px] font-semibold',
                            done
                              ? 'bg-mint text-forest'
                              : cancelled
                                ? 'bg-red-50 text-red-700'
                                : isNext
                                  ? 'bg-navy text-white'
                                  : 'bg-neutral-badge text-ink'
                          )}
                        >
                          {done
                            ? t('stops.collected')
                            : cancelled
                              ? t('stops.cancelled')
                              : isNext
                                ? t('stops.next')
                                : t('stops.todo')}
                        </span>
                      </span>
                    </li>
                  );
                }
              )}
            </ol>
            <div className="flex items-center gap-3.5 py-2.5 pl-1.5 text-[13px] text-ink">
              <span className="size-6 shrink-0 rounded-md border-[1.5px] border-navy" />
              <span>
                {t('stops.return')}{' '}
                <span className="font-mono text-navy">
                  {interval && selectedPlan?.totalMinutes ? clockAfter(interval, selectedPlan.totalMinutes) : '—'}
                </span>
              </span>
            </div>
          </section>

          <div className="flex flex-col gap-3">
            {selected.route.vehicle ? (
              (() => {
                const capacity = selected.route.vehicle.capacityBags;
                const collected = selected.stops.filter(isDone).reduce((acc, r) => acc + (r.estimatedBags ?? 0), 0);
                const remaining = selected.bags - collected;
                const left = selected.stops.filter((r) => !isDone(r) && r.status !== CollectionRequestStatus.CANCELLED).length;
                return (
                  <div className="flex flex-col gap-2.5 rounded-2xl bg-[linear-gradient(125deg,#013364_0%,#02748e_100%)] px-5 py-[18px] text-white">
                    <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/70">
                      {selected.route.vehicle.name} {selected.route.vehicle.plate} · {selected.route.driver?.firstName}{' '}
                      {selected.route.driver?.lastName}
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-sm">{t('van.inVan')}</span>
                      <span className="font-mono text-[22px]">
                        {collected} / {capacity}
                      </span>
                    </p>
                    <span className="h-[7px] overflow-hidden rounded-[4px] bg-white/25">
                      <span
                        className="block h-full bg-white/90"
                        style={{ width: `${Math.min(100, (collected / capacity) * 100)}%` }}
                      />
                    </span>
                    <p className="text-xs leading-[18px] text-white/90">
                      {t('van.remaining', { bags: remaining, stops: left, end: selected.bags, capacity })}
                    </p>
                  </div>
                );
              })()
            ) : (
              <p className="rounded-2xl border border-dashed border-field bg-white px-5 py-4 text-xs text-ink">
                {t('van.none')}
              </p>
            )}
            <div className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-white px-5 py-[18px] text-[13px]">
              <p className="flex justify-between gap-3">
                <span className="text-ink">{t('status.confirmed')}</span>
                <span className="font-mono text-navy">
                  {selected.route.confirmedCount ?? '—'} / {selected.route.collectionRequestsCount ?? selected.stops.length}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-ink">{t('status.code')}</span>
                <span className="font-mono text-navy">{selected.route.friendlyCode ?? '—'}</span>
              </p>
              <Link href="/portal/coleta" className="font-semibold text-teal underline underline-offset-2">
                {t('status.driverScreen')} →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
