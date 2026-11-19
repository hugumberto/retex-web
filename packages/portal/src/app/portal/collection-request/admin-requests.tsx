'use client';

import {
  CollectionRequestDTO,
  CollectionRequestStatus,
} from '@/app/types/collection-request';
import {
  CollectionInterval,
  CollectionStatus,
  PackageCollectionDTO,
} from '@/app/types/package-collection';
import { Role, UserDTO, UserStatus } from '@/app/types/user';
import { VehicleDTO } from '@/app/types/vehicle';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import api from '@/lib/api';
import { cn, isSuccessStatus } from '@/lib/utils';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Search, TrashIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import RequestDetailsDialog from './request-details-dialog';

/**
 * Pedidos de recolha — vista de ADMIN/OPS (Figma "RETEX Backoffice" → 08-Admin).
 *
 * Os estados da API agrupam-se nos cinco cartões do design. "Novo" é só o que
 * ainda não está em nenhuma rota: é o que se pode selecionar para criar uma.
 */
type Bucket = 'new' | 'scheduled' | 'transit' | 'collected' | 'warehouse' | 'other';

const CARD_BUCKETS: { key: Exclude<Bucket, 'other'>; dot: string }[] = [
  { key: 'new', dot: 'bg-teal' },
  { key: 'scheduled', dot: 'bg-navy' },
  { key: 'transit', dot: 'bg-[#e8a33d]' },
  { key: 'collected', dot: 'bg-navy' },
  { key: 'warehouse', dot: 'bg-forest' },
];

const BADGE: Record<Bucket, string> = {
  new: 'bg-neutral-badge text-ink',
  scheduled: 'bg-sky text-navy',
  transit: 'bg-[#fdf1dc] text-[#8a5a12]',
  collected: 'bg-sky text-navy',
  warehouse: 'bg-mint text-forest',
  other: 'bg-red-50 text-red-700',
};

export function bucketOf(request: CollectionRequestDTO): Bucket {
  switch (request.status) {
    case CollectionRequestStatus.CREATED:
      return request.route ? 'scheduled' : 'new';
    case CollectionRequestStatus.CONFIRMED:
    case CollectionRequestStatus.WAITING_FOR_COLLECTION:
      return 'scheduled';
    case CollectionRequestStatus.IN_TRANSIT:
      return 'transit';
    case CollectionRequestStatus.COLLECTED:
      return 'collected';
    case CollectionRequestStatus.IN_HOUSE:
    case CollectionRequestStatus.SCREENING:
    case CollectionRequestStatus.STOCKED:
      return 'warehouse';
    default:
      return 'other';
  }
}

const PAGE_SIZE = 10;
const HOURS_48 = 48 * 60 * 60 * 1000;

// O decimal do Postgres chega como string.
const weightOf = (request: CollectionRequestDTO) => Number(request.weight ?? 0) || 0;

const clientName = (request: CollectionRequestDTO) =>
  `${request.user?.firstName ?? ''} ${request.user?.lastName ?? ''}`.trim() || '—';

type Props = {
  requests: CollectionRequestDTO[];
  onRefresh: () => Promise<void> | void;
  onCancel: (id: string) => Promise<void> | void;
  /** Botão de criar pedido para um cliente ao balcão (diálogo já existente). */
  createAction?: ReactNode;
};

export default function AdminRequests({
  requests,
  onRefresh,
  onCancel,
  createAction,
}: Props) {
  const t = useTranslations('collectionRequest.admin');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const locale = useLocale();

  const [bucket, setBucket] = useState<Bucket>('new');
  const [search, setSearch] = useState('');
  const [thisWeek, setThisWeek] = useState(false);
  const [city, setCity] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<string[]>([]);
  const [transitRoutes, setTransitRoutes] = useState<PackageCollectionDTO[]>([]);

  const number = useCallback(
    (value: number, digits = 0) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value),
    [locale]
  );
  const weightLabel = (kg: number) =>
    kg >= 1000 ? `${number(kg / 1000, 1)} t` : `${number(kg)} kg`;
  const windowLabel = (request: CollectionRequestDTO) => {
    const route = request.route;
    if (!route?.startDate) return '—';
    const day = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(new Date(route.startDate));
    return route.collectionInterval ? `${day} · ${route.collectionInterval}` : day;
  };

  // Só para "N motoristas na rua": a listagem de pedidos não traz o motorista.
  useEffect(() => {
    api
      .get<{ data: PackageCollectionDTO[] } | PackageCollectionDTO[]>(
        `/route?status=${CollectionStatus.IN_TRANSIT}`
      )
      .then(({ data }) => setTransitRoutes(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setTransitRoutes([]));
  }, [requests]);

  const byBucket = useMemo(() => {
    const groups: Record<Bucket, CollectionRequestDTO[]> = {
      new: [],
      scheduled: [],
      transit: [],
      collected: [],
      warehouse: [],
      other: [],
    };
    for (const request of requests) groups[bucketOf(request)].push(request);
    return groups;
  }, [requests]);

  const cardHints = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const stale = byBucket.new.filter(
      (r) => r.createdAt && now.getTime() - new Date(r.createdAt).getTime() > HOURS_48
    ).length;
    const routesThisWeek = new Set(
      byBucket.scheduled
        .filter((r) => {
          const start = r.route?.startDate ? new Date(r.route.startDate) : null;
          return start && start >= weekStart && start <= weekEnd;
        })
        .map((r) => r.route?.id)
    ).size;
    const drivers = new Set(
      transitRoutes.map((route) => route.driver?.id).filter(Boolean)
    ).size;
    const warehouseThisMonth = byBucket.warehouse.filter(
      (r) => r.updatedAt && new Date(r.updatedAt) >= monthStart
    );

    return {
      new: t('cards.new.hint', { count: stale }),
      scheduled: t('cards.scheduled.hint', { count: routesThisWeek }),
      transit: t('cards.transit.hint', { count: drivers }),
      collected: t('cards.collected.hint'),
      warehouse: t('cards.warehouse.hint', {
        count: warehouseThisMonth.length,
        weight: weightLabel(warehouseThisMonth.reduce((acc, r) => acc + weightOf(r), 0)),
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byBucket, transitRoutes, t, locale]);

  const cities = useMemo(
    () =>
      [...new Set(requests.map((r) => r.address?.city?.trim()).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, 'pt')
      ),
    [requests]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return byBucket[bucket]
      .filter((r) => !city || r.address?.city?.trim() === city)
      .filter((r) => !thisWeek || (r.createdAt && new Date(r.createdAt) >= weekStart))
      .filter((r) => {
        if (!query) return true;
        return [
          r.friendlyCode,
          clientName(r),
          r.user?.email,
          r.address?.zipCode,
          r.address?.city,
          r.address?.street,
          r.company?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
  }, [byBucket, bucket, city, thisWeek, search]);

  // Mudar de filtro volta à primeira página; a seleção só vive em "Novos".
  useEffect(() => setVisible(PAGE_SIZE), [bucket, city, thisWeek, search]);
  useEffect(() => {
    if (bucket !== 'new') setSelected([]);
  }, [bucket]);
  useEffect(() => {
    const available = new Set(byBucket.new.map((r) => r.id));
    setSelected((current) => current.filter((id) => available.has(id)));
  }, [byBucket]);

  const rows = filtered.slice(0, visible);
  const selectedRequests = selected
    .map((id) => byBucket.new.find((r) => r.id === id))
    .filter(Boolean) as CollectionRequestDTO[];
  const allVisibleSelected =
    bucket === 'new' && rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  const toggleAll = () =>
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !rows.some((r) => r.id === id))
        : [...new Set([...current, ...rows.map((r) => r.id)])]
    );

  const exportCsv = () => {
    const header = [
      t('csv.code'),
      t('csv.client'),
      t('csv.email'),
      t('csv.phone'),
      t('csv.zipCode'),
      t('csv.city'),
      t('csv.street'),
      t('csv.bags'),
      t('csv.window'),
      t('csv.status'),
      t('csv.createdAt'),
    ];
    const escape = (value: unknown) => {
      const text = value === undefined || value === null ? '' : String(value);
      return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = filtered.map((r) =>
      [
        r.friendlyCode,
        clientName(r),
        r.user?.email,
        r.user?.contactPhone,
        r.address?.zipCode,
        r.address?.city,
        `${r.address?.street ?? ''} ${r.address?.number ?? ''}`.trim(),
        r.estimatedBags,
        windowLabel(r),
        tStatus(r.status),
        r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm') : '',
      ]
        .map(escape)
        .join(';')
    );
    // `;` e BOM: é o que o Excel em português abre sem assistente.
    const blob = new Blob(['﻿' + [header.join(';'), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedidos-recolha-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
      active ? 'border-navy bg-navy text-white' : 'border-navy bg-white text-navy hover:bg-panel'
    );

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <label className="relative w-full sm:w-[330px]">
          <span className="sr-only">{t('searchPlaceholder')}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-12 w-full rounded-[10px] border border-field bg-white pl-10 pr-4 text-sm text-navy placeholder:text-[#757575] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex h-11 items-center rounded-full border border-navy bg-white px-[22px] text-sm font-semibold text-navy hover:bg-panel disabled:opacity-50"
        >
          {t('exportCsv')}
        </button>
        {createAction}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {CARD_BUCKETS.map(({ key, dot }) => {
          const active = bucket === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setBucket(key)}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-start gap-1 rounded-[14px] bg-white px-[18px] py-4 text-left transition-colors',
                active ? 'border-2 border-navy' : 'border border-line-soft hover:border-slate'
              )}
            >
              <span className="flex items-center gap-[7px] text-[13px] font-semibold text-navy">
                <span className={cn('size-1.5 rounded-full', dot)} />
                {t(`cards.${key}.label`)}
              </span>
              <span className="text-[28px] font-bold tracking-[-0.02em] text-navy">
                {number(byBucket[key].length)}
              </span>
              <span className="font-mono text-[10px] text-ink">{cardHints[key]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-line-soft bg-white py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
            <div className="flex flex-wrap gap-1.5">
              <span className={chip(true)}>
                {t(`cards.${bucket}.chip`)}
                <span className="font-mono text-[11px] text-white/75">
                  {number(byBucket[bucket].length)}
                </span>
              </span>
              <label className={cn(chip(!!city), 'relative pr-7')}>
                <span className="sr-only">{t('cityFilter')}</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="cursor-pointer appearance-none bg-transparent focus:outline-none"
                >
                  <option value="">{t('allCities')}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span aria-hidden className="pointer-events-none absolute right-3 text-xs">
                  ⌄
                </span>
              </label>
              <button
                type="button"
                className={chip(thisWeek)}
                aria-pressed={thisWeek}
                onClick={() => setThisWeek((v) => !v)}
              >
                {t('thisWeek')}
              </button>
              <button
                type="button"
                className={chip(bucket === 'other')}
                aria-pressed={bucket === 'other'}
                onClick={() => setBucket(bucket === 'other' ? 'new' : 'other')}
              >
                {t('cards.other.chip')}
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    bucket === 'other' ? 'text-white/75' : 'text-navy/75'
                  )}
                >
                  {number(byBucket.other.length)}
                </span>
              </button>
            </div>
            {bucket === 'new' && selected.length > 0 ? (
              <span className="text-[13px] text-ink">
                {t('selectedCount', { count: selected.length })}
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px] text-navy">
              <thead>
                <tr className="h-10 bg-panel text-left text-[10px] uppercase tracking-[0.06em] text-ink">
                  <th className="w-[50px] pl-4 font-normal">
                    {bucket === 'new' ? (
                      <input
                        type="checkbox"
                        aria-label={t('selectAll')}
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        className="size-[18px] accent-navy"
                      />
                    ) : null}
                  </th>
                  <th className="font-normal">{t('columns.request')}</th>
                  <th className="font-normal">{t('columns.client')}</th>
                  <th className="font-normal">{t('columns.place')}</th>
                  <th className="font-normal">{t('columns.window')}</th>
                  <th className="font-normal">{t('columns.bags')}</th>
                  <th className="font-normal">{t('columns.status')}</th>
                  <th className="pr-4 font-normal">
                    <span className="sr-only">{t('columns.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-ink">
                      {t('empty')}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const isSelected = selected.includes(r.id);
                    const b = bucketOf(r);
                    return (
                      <tr
                        key={r.id}
                        className={cn('h-[52px] border-t border-line', isSelected && 'bg-row-selected')}
                      >
                        <td className="pl-4">
                          {b === 'new' ? (
                            <input
                              type="checkbox"
                              aria-label={t('selectRequest', { code: r.friendlyCode ?? '' })}
                              checked={isSelected}
                              onChange={() => toggle(r.id)}
                              className="size-[18px] accent-navy"
                            />
                          ) : null}
                        </td>
                        <td className="font-mono text-xs">{r.friendlyCode ?? '—'}</td>
                        <td className="max-w-[200px] truncate pr-3">
                          {r.company?.name ?? clientName(r)}
                        </td>
                        <td className="whitespace-nowrap pr-3">
                          {[r.address?.zipCode, r.address?.city].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="whitespace-nowrap pr-3">{windowLabel(r)}</td>
                        <td>{r.estimatedBags ?? '—'}</td>
                        <td>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-semibold',
                              BADGE[b]
                            )}
                          >
                            {tStatus(r.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap pr-4 text-right">
                          <RequestDetailsDialog request={r} />
                          {r.status === CollectionRequestStatus.CREATED ||
                          r.status === CollectionRequestStatus.OUT_OF_ZONE ? (
                            <ConfirmDialog
                              trigger={
                                <button
                                  type="button"
                                  aria-label={t('cancel')}
                                  className="inline-flex size-8 items-center justify-center rounded-md text-ink hover:bg-panel hover:text-red-700"
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                              }
                              onConfirm={() => onCancel(r.id)}
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-line px-4 pt-4 text-[13px]">
            <span className="text-ink">
              {t('showing', { shown: rows.length, total: filtered.length })}
            </span>
            {visible < filtered.length ? (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="font-semibold text-teal underline underline-offset-2"
              >
                {t('loadMore')}
              </button>
            ) : null}
          </div>
        </div>

        <NewRoutePanel
          requests={selectedRequests}
          onCreated={async () => {
            setSelected([]);
            await onRefresh();
          }}
        />
      </div>
    </section>
  );
}

// Intervalos tal como a API os guarda ("09:00 - 13:00").
const INTERVALS = Object.values(CollectionInterval);

function NewRoutePanel({
  requests,
  onCreated,
}: {
  requests: CollectionRequestDTO[];
  onCreated: () => Promise<void>;
}) {
  const t = useTranslations('collectionRequest.admin.route');
  const locale = useLocale();
  const [drivers, setDrivers] = useState<UserDTO[]>([]);
  const [driverId, setDriverId] = useState('');
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [interval, setInterval] = useState<CollectionInterval | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<UserDTO[]>('/user')
      .then(({ data }) =>
        setDrivers(
          (data ?? []).filter(
            (u) =>
              u.roles.some((role) => role.role === Role.DRIVER) &&
              u.status === UserStatus.ACTIVE
          )
        )
      )
      .catch(() => setDrivers([]));
    // Só os ativos se podem escolher; a API recusa os outros.
    api
      .get<VehicleDTO[]>('/vehicle')
      .then(({ data }) => setVehicles((data ?? []).filter((v) => v.active)))
      .catch(() => setVehicles([]));
  }, []);

  const totalBags = requests.reduce((acc, r) => acc + (r.estimatedBags ?? 0), 0);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  // Os sacos são a estimativa do cliente: passar a capacidade avisa, não bloqueia.
  const overCapacity = !!vehicle && totalBags > vehicle.capacityBags;
  const canSchedule = requests.length > 0 && !!driverId && !!date && !!interval && !isSaving;
  const summary = date
    ? [
        new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
          new Date(`${date}T12:00:00`)
        ),
        interval || null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  // Cria a rota (nasce em rascunho) e passa-a logo a "criada": é essa transição
  // que, na API, envia a cada cliente o email para confirmar a janela.
  const schedule = async () => {
    if (!canSchedule) return;
    setIsSaving(true);
    try {
      const startDate = format(new Date(`${date}T00:00:00`), "yyyy-MM-dd HH:mm:ss'.000000+00'");
      const created = await api.post<PackageCollectionDTO>('/route', {
        driverId,
        startDate,
        collectionInterval: interval,
        collectionRequestIds: requests.map((r) => r.id),
        vehicleId: vehicleId || undefined,
        status: CollectionStatus.DRAFTING,
      });
      if (!isSuccessStatus(created.status) || !created.data?.id) throw new Error();
      const scheduled = await api.put(`/route/${created.data.id}`, {
        status: CollectionStatus.CREATED,
      });
      if (!isSuccessStatus(scheduled.status)) {
        toast.warning(t('draftOnly'));
      } else {
        toast.success(t('success', { count: requests.length }));
      }
      setDriverId('');
      setVehicleId('');
      setDate('');
      setInterval('');
      await onCreated();
    } catch {
      toast.error(t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const field =
    'h-12 w-full rounded-[10px] border border-field bg-white px-4 text-sm text-navy focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

  return (
    <aside className="flex w-full flex-col gap-3.5 rounded-2xl border border-line-soft bg-white p-5 xl:w-[412px] xl:shrink-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">{t('title')}</h2>
        {summary ? <span className="font-mono text-[11px] text-ink">{summary}</span> : null}
      </div>

      {requests.length === 0 ? (
        <p className="rounded-[10px] bg-panel px-4 py-6 text-center text-[13px] text-ink">
          {t('empty')}
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          <li className="flex items-center gap-2.5 text-[13px]">
            <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">
              A
            </span>
            {/* Hora de saída = início do período ("09:00 - 13:00" → 09:00). */}
            {interval ? `${t('warehouse')} ${interval.split(' - ')[0]}` : t('warehouse')}
          </li>
          {requests.map((r, i) => (
            <li key={r.id} className="flex items-center gap-2.5 text-[13px]">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {t('stop', {
                  name: r.company?.name ?? clientName(r),
                  bags: r.estimatedBags ?? 0,
                })}
              </span>
              <span className="font-mono text-[11px] text-ink">{r.address?.zipCode}</span>
            </li>
          ))}
        </ol>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-navy">{t('driver')}</span>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={field}>
          <option value="">{t('driverPlaceholder')}</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {`${d.firstName} ${d.lastName}`}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-navy">{t('date')}</span>
          <input
            type="date"
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-navy">{t('interval')}</span>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as CollectionInterval)}
            className={field}
          >
            <option value="">{t('intervalPlaceholder')}</option>
            {INTERVALS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-navy">{t('vehicle')}</span>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={field}>
          <option value="">{t('vehiclePlaceholder')}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {t('vehicleOption', { name: v.name, plate: v.plate, capacity: v.capacityBags })}
            </option>
          ))}
        </select>
      </label>

      <div
        className={cn(
          'flex items-center justify-between rounded-lg px-3 py-2.5 text-xs',
          overCapacity ? 'bg-red-50' : 'bg-panel'
        )}
      >
        <span className={overCapacity ? 'text-red-700' : 'text-ink'}>
          {vehicle ? t('occupancy') : t('totalBags')}
        </span>
        <span className={cn('font-mono', overCapacity ? 'text-red-700' : 'text-navy')}>
          {vehicle ? t('occupancyValue', { bags: totalBags, capacity: vehicle.capacityBags }) : totalBags}
        </span>
      </div>
      {overCapacity ? (
        <p className="-mt-2 text-xs text-red-700">{t('overCapacity')}</p>
      ) : null}

      <button
        type="button"
        onClick={schedule}
        disabled={!canSchedule}
        className="h-[54px] w-full rounded-full bg-navy px-8 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? t('saving') : t('submit')}
      </button>
      <p className="text-xs leading-[18px] text-ink">
        {t('footnote', { count: requests.length })}
      </p>
    </aside>
  );
}
