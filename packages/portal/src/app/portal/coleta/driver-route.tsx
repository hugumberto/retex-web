'use client';

import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { CollectionRequestBagDTO, CollectionResponse } from '@/app/types/collection-request-bag';
import { CollectionStatus, PackageCollectionDTO } from '@/app/types/package-collection';
import { Role } from '@/app/types/user';
import ScanInput from '@/components/custom/scan-input';
import api from '@/lib/api';
import { getUserRoles } from '@/lib/access-control';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { Check, ClipboardList, Route as RouteIcon, Truck, User as UserIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { calculatePlan, clockAfter, PlanResult, useSystemParameters } from '../collection-request/use-route-plan';
import { hasValidCoords, readCoords } from '../package-collection/utils';
import { formatZip } from '@/lib/address';

// Botão desativado legível (texto escuro sobre cinzento, contraste ≥ 4,5:1).
const DISABLED = 'bg-[#dde6e9] text-[#4f6573] [&_*]:text-[#4f6573]';

type Tab = 'route' | 'stops' | 'vehicle' | 'profile';
type RouteBags = { collectionRequest: { id: string }; bags: CollectionRequestBagDTO[] }[];

// Depois de recolhido, o pedido conta como paragem feita.
const DONE = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_TRANSIT,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
  CollectionRequestStatus.STOCKED,
];
const isDone = (r: CollectionRequestDTO) => DONE.includes(r.status);
const isCancelled = (r: CollectionRequestDTO) => r.status === CollectionRequestStatus.CANCELLED;
const isOpen = (r: CollectionRequestDTO) => !isDone(r) && !isCancelled(r);

// Ordem de preferência quando o motorista tem mais do que uma rota no dia.
const ROUTE_ORDER = [
  CollectionStatus.IN_TRANSIT,
  CollectionStatus.WAITING_TO_START,
  CollectionStatus.CREATED,
  CollectionStatus.DRAFTING,
  CollectionStatus.FINISHED,
];

const QUICK_REASONS = ['absent', 'wrongAddress', 'noAccess', 'refused'] as const;

const unwrap = <T,>(data: { data: T[] } | T[]): T[] => (Array.isArray(data) ? data : data?.data ?? []);
const clientName = (r: CollectionRequestDTO) =>
  r.company?.name ?? (`${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || '—');
const phoneOf = (r: CollectionRequestDTO) => r.company?.phone || r.user?.contactPhone || null;
const streetOf = (r: CollectionRequestDTO) =>
  [r.address?.street, r.address?.number].filter(Boolean).join(' ') || '—';
const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/**
 * Ecrã do motorista (Figma 14-Motorista): a rota de hoje no telemóvel, uma
 * paragem de cada vez. Recolher continua a exigir a leitura dos sacos (a API
 * recusa fechar sem eles); "Não consegui recolher" cancela com o motivo.
 */
export default function DriverRoute() {
  const t = useTranslations('driver');
  const { user } = useAppStore();
  const roles = getUserRoles(user);
  const isDriver = roles.includes(Role.DRIVER);
  const params = useSystemParameters();
  // `?date=YYYY-MM-DD` mostra outro dia (para o admin rever uma rota).
  const [today] = useState(() => {
    const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('date') : null;
    return fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) ? fromUrl : format(new Date(), 'yyyy-MM-dd');
  });

  const [tab, setTab] = useState<Tab>('route');
  const [routes, setRoutes] = useState<PackageCollectionDTO[]>([]);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [route, setRoute] = useState<PackageCollectionDTO | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [routeBags, setRouteBags] = useState<RouteBags>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const [collecting, setCollecting] = useState<CollectionRequestDTO | null>(null);
  const [bound, setBound] = useState<CollectionRequestBagDTO[]>([]);
  const [bagCode, setBagCode] = useState('');
  const [failing, setFailing] = useState<CollectionRequestDTO | null>(null);
  const [reason, setReason] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const bagRef = useRef<HTMLInputElement>(null);

  // Rotas de hoje: as do motorista; quem não conduz (admin) vê todas.
  const loadRoutes = useCallback(async () => {
    try {
      const { data } = await api.get('/route', {
        params: { date: today, limit: 50, ...(isDriver && user?.id ? { driverId: user.id } : {}) },
      });
      const list = unwrap<PackageCollectionDTO>(data).sort(
        (a, b) => ROUTE_ORDER.indexOf(a.status) - ROUTE_ORDER.indexOf(b.status)
      );
      setRoutes(list);
      setRouteId((current) => current ?? list[0]?.id ?? null);
      if (list.length === 0) setIsLoading(false);
    } catch {
      toast.error(t('loadError'));
      setIsLoading(false);
    }
  }, [today, isDriver, user?.id, t]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const loadRoute = useCallback(async () => {
    if (!routeId) return;
    setIsLoading(true);
    try {
      const [{ data }, bags] = await Promise.all([
        api.get<PackageCollectionDTO>(`/route/${routeId}`),
        api.get<RouteBags>(`/route/${routeId}/collection-request-bags`).catch(() => ({ data: [] as RouteBags })),
      ]);
      setRoute(data);
      setRouteBags(bags.data);
    } catch {
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [routeId, t]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  // Percurso (ordem, km e minutos por troço). Só se recalcula quando muda a lista.
  const requestsKey = (route?.collectionRequests ?? []).map((r) => r.id).join(',');
  useEffect(() => {
    if (!route) return;
    let cancelled = false;
    calculatePlan(route.collectionRequests ?? [], params).then((result) => {
      if (!cancelled) setPlan(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsKey, params]);

  // Paragens pela ordem do percurso, com o estado mais recente da rota.
  const stops = useMemo(() => {
    const byId = new Map((route?.collectionRequests ?? []).map((r) => [r.id, r]));
    const ordered = plan?.stops.length
      ? plan.stops.map((s) => ({ ...s, request: byId.get(s.request.id) ?? s.request }))
      : (route?.collectionRequests ?? []).map((request) => ({ request, arrivalMinutes: null, legKm: null, legMinutes: null }));
    return ordered.map((s, index) => ({ ...s, n: index + 1 }));
  }, [plan, route]);

  const doneCount = stops.filter((s) => isDone(s.request)).length;
  const current =
    stops.find((s) => s.request.id === pickedId && isOpen(s.request)) ?? stops.find((s) => isOpen(s.request)) ?? null;
  // Antes de iniciar, a lista mostra todas as paragens (ainda não há "a seguir").
  const upcoming = stops.filter(
    (s) => (route?.status !== CollectionStatus.IN_TRANSIT || s !== current) && isOpen(s.request)
  );
  const interval = route?.collectionInterval ?? null;
  const eta = (minutes: number | null | undefined) =>
    interval && minutes != null ? clockAfter(interval, minutes) : null;
  const bagsInVan = routeBags
    .filter((rb) => {
      const r = route?.collectionRequests?.find((x) => x.id === rb.collectionRequest.id);
      return r ? isDone(r) : false;
    })
    .reduce((sum, rb) => sum + rb.bags.length, 0);
  const vehicle = route?.vehicle ?? null;

  const startRoute = async () => {
    if (!route) return;
    setIsBusy(true);
    try {
      await api.put(`/route/${route.id}`, { status: CollectionStatus.IN_TRANSIT });
      toast.success(t('started'));
      await loadRoute();
    } catch (error) {
      toast.error(apiMessage(error, t('startError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Recolher: ler os sacos e fechar ────────────────────────────────────────
  const openCollect = async (request: CollectionRequestDTO) => {
    setCollecting(request);
    setBound([]);
    setBagCode('');
    try {
      const { data } = await api.get<CollectionResponse>(`/collection/${request.id}`);
      setBound(data.bags ?? []);
    } catch {
      // Sem sacos lidos ainda.
    }
    requestAnimationFrame(() => bagRef.current?.focus());
  };

  const bindBag = async (value: string) => {
    const code = value.trim();
    if (!code || !collecting) return;
    try {
      const { data } = await api.post<CollectionRequestBagDTO>(`/collection/${collecting.id}/bind`, { code });
      setBound((list) => (list.some((b) => b.id === data.id) ? list : [...list, data]));
      toast.success(t('collect.bagRead', { code: data.friendlyCode }));
    } catch (error) {
      toast.error(apiMessage(error, t('collect.bagError')));
    } finally {
      setBagCode('');
      requestAnimationFrame(() => bagRef.current?.focus());
    }
  };

  const finishCollect = async () => {
    if (!collecting || bound.length === 0) return;
    setIsBusy(true);
    try {
      await api.post(`/collection/${collecting.id}/finalize`);
      toast.success(t('collect.done', { name: clientName(collecting) }));
      setCollecting(null);
      setPickedId(null);
      await loadRoute();
    } catch (error) {
      toast.error(apiMessage(error, t('collect.finishError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Não consegui recolher: cancela com o motivo ────────────────────────────
  const confirmFail = async () => {
    if (!failing || !reason.trim()) return;
    setIsBusy(true);
    try {
      await api.post(`/collection/${failing.id}/cancel`, { reason: reason.trim() });
      toast.success(t('fail.done'));
      setFailing(null);
      setReason('');
      setPickedId(null);
      await loadRoute();
    } catch (error) {
      toast.error(apiMessage(error, t('fail.error')));
    } finally {
      setIsBusy(false);
    }
  };

  const mapsUrl = (r: CollectionRequestDTO) => {
    if (hasValidCoords(r)) {
      const { lat, long } = readCoords(r);
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`;
    }
    const text = [streetOf(r), formatZip(r.address?.zipCode), r.address?.city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(text)}`;
  };

  const statusBadge = (r: CollectionRequestDTO) =>
    isDone(r)
      ? { label: t('stops.collected'), cls: 'bg-mint text-forest' }
      : isCancelled(r)
        ? { label: t('stops.cancelled'), cls: 'bg-[#fbe3df] text-[#a12a1e]' }
        : { label: t('stops.todo'), cls: 'bg-neutral-badge text-ink' };

  const pill = 'flex h-[54px] items-center justify-center rounded-full border-[1.5px] border-navy text-[16px] font-semibold text-navy';

  return (
    <div className="fixed inset-0 z-40 flex justify-center overflow-hidden bg-[#dfe7ea]">
      <div className="flex h-full w-full max-w-[480px] flex-col bg-canvas text-navy">
        {/* Cabeçalho */}
        <header className="shrink-0 bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)] px-5 pb-5 pt-6 text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-baseline gap-2">
              <span className="text-[19px] font-bold">ReTeX:ID</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/80">{t('badge')}</span>
            </span>
            <span className="font-mono text-[13px]">{vehicle?.plate ?? ''}</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h1 className="text-left text-[24px] font-bold">
              {tab === 'route' && today !== format(new Date(), 'yyyy-MM-dd')
                ? t('titles.routeOn', { date: today.split('-').reverse().slice(0, 2).join('/') })
                : t(`titles.${tab}`)}
            </h1>
            {route && stops.length > 0 ? (
              <span className="font-mono text-[12px] text-white/85">
                {t('progress', { done: doneCount, total: stops.length })}
              </span>
            ) : null}
          </div>
          {stops.length > 0 ? (
            <div className="mt-3.5 flex gap-1">
              {stops.map((s) => (
                <span
                  key={s.request.id}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    isDone(s.request) ? 'bg-white' : isCancelled(s.request) ? 'bg-[#e8a59c]' : 'bg-white/30'
                  )}
                />
              ))}
            </div>
          ) : null}
          {routes.length > 1 ? (
            <div className="mt-3 flex gap-1.5 overflow-x-auto">
              {routes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRouteId(r.id);
                    setPickedId(null);
                  }}
                  className={cn(
                    'shrink-0 rounded-full border border-white/60 px-3 py-1 font-mono text-[11px]',
                    r.id === routeId ? 'bg-white text-navy' : 'text-white'
                  )}
                >
                  {r.friendlyCode ?? r.id.slice(0, 6)}
                  {!isDriver && r.driver ? ` · ${r.driver.firstName}` : ''}
                </button>
              ))}
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && !route ? <p className="py-10 text-center text-sm text-ink">{t('loading')}</p> : null}

          {!isLoading && routes.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center">
              <p className="text-[17px] font-semibold">
                {today === format(new Date(), 'yyyy-MM-dd')
                  ? t('noRoute')
                  : t('noRouteOn', { date: format(new Date(`${today}T12:00:00`), 'dd/MM') })}
              </p>
              <p className="mt-1 text-sm text-ink">{t('noRouteHint')}</p>
            </div>
          ) : null}

          {/* Rota */}
          {tab === 'route' && route ? (
            <div className="flex flex-col gap-4">
              {route.status === CollectionStatus.WAITING_TO_START ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
                  <p className="text-[15px]">
                    {t('notStarted', { time: interval ? interval.split(' - ')[0] : '—', count: stops.length })}
                  </p>
                  <button
                    type="button"
                    onClick={startRoute}
                    disabled={isBusy}
                    className="h-[56px] rounded-full bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)] text-[17px] font-semibold text-white disabled:opacity-60"
                  >
                    {t('start')}
                  </button>
                </div>
              ) : null}
              {route.status === CollectionStatus.CREATED || route.status === CollectionStatus.DRAFTING ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-ink">{t('notConfirmed')}</p>
              ) : null}

              {current && route.status === CollectionStatus.IN_TRANSIT ? (
                <section className="flex flex-col gap-3.5 rounded-2xl bg-white p-[18px] shadow-[0_1px_2px_rgba(1,51,100,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#dceff3] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-navy">
                      {t('stop.next', { n: current.n })}
                    </span>
                    <span className="whitespace-nowrap font-mono text-[13px]">{interval?.replace(' - ', '–') ?? ''}</span>
                  </div>
                  <h2 className="text-[22px] font-bold leading-tight">
                    {streetOf(current.request)}
                    {current.request.address?.city ? `, ${current.request.address.city}` : ''}
                  </h2>
                  <p className="text-[15px] text-ink">
                    {[clientName(current.request), current.request.address?.complement].filter(Boolean).join(' · ')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      [String(current.request.estimatedBags ?? '—'), t('stop.bags')],
                      [current.legKm != null ? current.legKm.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : '—', 'km'],
                      [current.legMinutes != null ? String(current.legMinutes) : '—', 'min'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-xl bg-canvas py-3 text-center">
                        <p className="text-[22px] font-bold">{value}</p>
                        <p className="text-[13px] text-ink">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={mapsUrl(current.request)} target="_blank" rel="noreferrer" className={pill}>
                      {t('stop.navigate')}
                    </a>
                    {phoneOf(current.request) ? (
                      <a href={`tel:${phoneOf(current.request)}`} className={pill}>
                        {t('stop.call')}
                      </a>
                    ) : (
                      <span className={cn(pill, 'opacity-40')}>{t('stop.call')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openCollect(current.request)}
                    className="h-[60px] rounded-full bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)] text-[17px] font-semibold text-white"
                  >
                    {t('stop.collect')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFailing(current.request);
                      setReason('');
                    }}
                    className="text-[15px] font-medium text-[#a12a1e] underline underline-offset-2"
                  >
                    {t('stop.fail')}
                  </button>
                </section>
              ) : null}

              {route.status === CollectionStatus.IN_TRANSIT && !current ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-forest text-white">
                    <Check className="size-6" />
                  </span>
                  <p className="text-[17px] font-semibold">{t('allDone')}</p>
                  <p className="text-sm text-ink">{t('backToWarehouse', { count: bagsInVan })}</p>
                </div>
              ) : null}
              {route.status === CollectionStatus.FINISHED ? (
                <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink">{t('finished')}</p>
              ) : null}

              {upcoming.length > 0 ? (
                <>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink">{t('upcoming')}</p>
                  <div className="overflow-hidden rounded-2xl bg-white">
                    {upcoming.map((s, i) => (
                      <button
                        key={s.request.id}
                        type="button"
                        onClick={() => setPickedId(s.request.id)}
                        className={cn(
                          'flex w-full items-center gap-3.5 border-b border-line-soft px-4 py-3.5 text-left last:border-b-0',
                          i >= 2 && 'opacity-50'
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas text-[12px] text-ink">
                          {s.n}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[17px] font-semibold">{clientName(s.request)}</span>
                          <span className="block truncate text-[13px] text-ink">
                            {[streetOf(s.request), s.request.address?.city].filter(Boolean).join(', ')} ·{' '}
                            {t('stop.bagsCount', { count: s.request.estimatedBags ?? 0 })}
                          </span>
                        </span>
                        <span className="font-mono text-[13px]">{eta(s.arrivalMinutes) ?? ''}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {/* Pedidos: todas as paragens do dia */}
          {tab === 'stops' && route ? (
            <div className="overflow-hidden rounded-2xl bg-white">
              {stops.map((s) => {
                const badge = statusBadge(s.request);
                return (
                  <button
                    key={s.request.id}
                    type="button"
                    disabled={!isOpen(s.request)}
                    onClick={() => {
                      setPickedId(s.request.id);
                      setTab('route');
                    }}
                    className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-3.5 text-left last:border-b-0"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas text-[12px] text-ink">
                      {s.n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">{clientName(s.request)}</span>
                      <span className="block truncate text-[12px] text-ink">
                        {s.request.friendlyCode} · {streetOf(s.request)} ·{' '}
                        {t('stop.bagsCount', { count: s.request.estimatedBags ?? 0 })}
                      </span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', badge.cls)}>
                      {badge.label}
                    </span>
                  </button>
                );
              })}
              {stops.length === 0 ? <p className="p-5 text-sm text-ink">{t('noStops')}</p> : null}
            </div>
          ) : null}

          {/* Veículo */}
          {tab === 'vehicle' && route ? (
            <div className="flex flex-col gap-3">
              {vehicle ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
                  <p className="font-mono text-[22px] font-semibold">{vehicle.plate}</p>
                  <p className="text-sm text-ink">{vehicle.name}</p>
                  <div className="h-3 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${Math.min(100, (bagsInVan / Math.max(1, vehicle.capacityBags)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[15px]">{t('vehicle.load', { bags: bagsInVan, capacity: vehicle.capacityBags })}</p>
                  <p className="text-xs text-ink">
                    {t('vehicle.remaining', {
                      count: stops.filter((s) => isOpen(s.request)).reduce((sum, s) => sum + (s.request.estimatedBags ?? 0), 0),
                    })}
                  </p>
                </div>
              ) : (
                <p className="rounded-2xl bg-white p-5 text-sm text-ink">{t('vehicle.none')}</p>
              )}
              <div className="rounded-2xl bg-white p-5 text-sm">
                <p className="text-ink">{t('vehicle.routeCode')}</p>
                <p className="font-mono text-[17px]">{route.friendlyCode ?? '—'}</p>
              </div>
            </div>
          ) : null}

          {/* Perfil */}
          {tab === 'profile' ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-[19px] font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-ink">{user?.email}</p>
              </div>
              <Link href="/portal/perfil" className="rounded-2xl bg-white p-5 text-[15px] font-semibold">
                {t('profile.account')}
              </Link>
              <Link href="/portal/coleta?manual=1" className="rounded-2xl bg-white p-5 text-[15px] font-semibold">
                {t('profile.manual')}
                <span className="block text-xs font-normal text-ink">{t('profile.manualHint')}</span>
              </Link>
              <Link href="/portal" className="rounded-2xl bg-white p-5 text-[15px] font-semibold">
                {t('profile.portal')}
              </Link>
            </div>
          ) : null}
        </div>

        {/* Barra de navegação */}
        <nav className="grid shrink-0 grid-cols-4 border-t border-line-soft bg-white pb-[env(safe-area-inset-bottom)]">
          {(
            [
              ['route', RouteIcon],
              ['stops', ClipboardList],
              ['vehicle', Truck],
              ['profile', UserIcon],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-3 text-[12px]',
                tab === key ? 'font-semibold text-navy' : 'text-ink'
              )}
            >
              <Icon className="size-[18px]" />
              {t(`tabs.${key}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Recolher: ler os sacos */}
      {collecting ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40" role="dialog" aria-modal>
          <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-t-3xl bg-white p-5 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink">{collecting.friendlyCode}</p>
                <h2 className="text-[20px] font-bold">{clientName(collecting)}</h2>
                <p className="text-sm text-ink">{t('collect.hint', { count: collecting.estimatedBags ?? 0 })}</p>
              </div>
              <button type="button" aria-label={t('close')} onClick={() => setCollecting(null)}>
                <X className="size-5" />
              </button>
            </div>
            <ScanInput
              inputRef={bagRef}
              value={bagCode}
              onChange={setBagCode}
              onScan={bindBag}
              autoFocus
              placeholder={t('collect.placeholder')}
              scanTitle={t('collect.scan')}
              inputClassName="h-[52px] rounded-xl border-[1.5px] border-navy font-mono text-[17px]"
            />
            <div className="flex flex-wrap gap-1.5">
              {bound.map((b) => (
                <span key={b.id} className="rounded-lg bg-mint px-2.5 py-1 font-mono text-[12px] text-forest">
                  {b.friendlyCode}
                </span>
              ))}
              {bound.length === 0 ? <span className="text-xs text-ink">{t('collect.none')}</span> : null}
            </div>
            <button
              type="button"
              disabled={bound.length === 0 || isBusy}
              onClick={finishCollect}
              className={cn(
                'h-[58px] rounded-full text-[17px] font-semibold text-white',
                bound.length > 0 ? 'bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)]' : DISABLED
              )}
            >
              {bound.length > 0 ? t('collect.finish', { count: bound.length }) : t('collect.readFirst')}
            </button>
          </div>
        </div>
      ) : null}

      {/* Não consegui recolher */}
      {failing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40" role="dialog" aria-modal>
          <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-t-3xl bg-white p-5 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold">{t('fail.title')}</h2>
                <p className="text-sm text-ink">{t('fail.body', { name: clientName(failing) })}</p>
              </div>
              <button type="button" aria-label={t('close')} onClick={() => setFailing(null)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReason(t(`fail.reasons.${key}`))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm',
                    reason === t(`fail.reasons.${key}`) ? 'border-navy bg-navy text-white' : 'border-navy text-navy'
                  )}
                >
                  {t(`fail.reasons.${key}`)}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t('fail.placeholder')}
              className="rounded-xl border border-field p-3 text-[15px]"
            />
            <p className="text-xs text-ink">{t('fail.warning')}</p>
            <button
              type="button"
              disabled={!reason.trim() || isBusy}
              onClick={confirmFail}
              className={cn(
                'h-[56px] rounded-full text-[16px] font-semibold text-white',
                reason.trim() ? 'bg-[#a12a1e]' : DISABLED
              )}
            >
              {t('fail.confirm')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
