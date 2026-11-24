'use client';

import { CollectionRequestStatus } from '@/app/types/collection-request';
import { StorageUnitDTO, Status } from '@/app/types/storage-unit';
import {
  OUTBOUND_ZONE,
  OutboundStatus,
  OutboundType,
  ReceiveResult,
  StorageZone,
  WarehouseOutboundDTO,
  WarehouseOverview,
  ZONE_LETTER,
} from '@/app/types/warehouse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// A partir daqui a zona está cheia e pede uma saída.
const FULL_RATIO = 0.9;

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

const unitZone = (unit: StorageUnitDTO): StorageZone =>
  (unit.zone as StorageZone | null | undefined) ??
  (unit.group === 'NON_REUSABLE' ? StorageZone.RECYCLING : StorageZone.REUSE);

type OutboundForm = {
  id?: string;
  type: OutboundType;
  destination: string;
  scheduledDate: string;
  storageUnitIds: string[];
  weight: string;
  pieces: string;
  notes: string;
};

const emptyForm = (): OutboundForm => ({
  type: OutboundType.RECYCLING,
  destination: '',
  scheduledDate: format(new Date(), 'yyyy-MM-dd'),
  storageUnitIds: [],
  weight: '',
  pieces: '',
  notes: '',
});

/** Ecrã "Receção e armazém" (Figma 11-Admin-Armazém). */
export default function Warehouse() {
  const t = useTranslations('warehouse');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const locale = useLocale();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [overview, setOverview] = useState<WarehouseOverview | null>(null);
  const [code, setCode] = useState('');
  const [weight, setWeight] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);
  const [form, setForm] = useState<OutboundForm | null>(null);
  const [units, setUnits] = useState<StorageUnitDTO[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  const kg = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale]
  );
  const shortDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    [locale]
  );

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<WarehouseOverview>('/warehouse');
      setOverview(data);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('title'));
    setBreadcrumbs([]);
    load();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [load, setPageTitle, setBreadcrumbs, t]);

  const receive = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(weight.replace(',', '.'));
    if (!code.trim()) {
      codeRef.current?.focus();
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(t('reception.invalidWeight'));
      weightRef.current?.focus();
      return;
    }
    setIsReceiving(true);
    try {
      const { data } = await api.post<ReceiveResult>('/warehouse/reception', {
        code: code.trim(),
        weight: Math.round(parsed * 100) / 100,
      });
      const complete = data.bagsReceived === data.bagsLinked;
      toast.success(
        complete
          ? t('reception.complete', { code: data.code ?? '—', count: data.bagsLinked })
          : t('reception.partial', {
              code: data.code ?? '—',
              received: data.bagsReceived,
              total: data.bagsLinked,
            })
      );
      setCode('');
      setWeight('');
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('reception.error')));
    } finally {
      setIsReceiving(false);
      requestAnimationFrame(() => codeRef.current?.focus());
    }
  };

  const openForm = async (outbound?: WarehouseOutboundDTO) => {
    setForm(
      outbound
        ? {
            id: outbound.id,
            type: outbound.type,
            destination: outbound.destination,
            scheduledDate: outbound.scheduledDate,
            storageUnitIds: (outbound.storageUnits ?? []).map((u) => u.id),
            weight: outbound.weight != null ? String(Number(outbound.weight)) : '',
            pieces: outbound.pieces != null ? String(outbound.pieces) : '',
            notes: outbound.notes ?? '',
          }
        : emptyForm()
    );
    try {
      const { data } = await api.get<StorageUnitDTO[]>('/storage-unit');
      setUnits(data);
    } catch {
      setUnits([]);
    }
  };

  // Lotes que esta saída pode levar: ativos, da zona do tipo de saída e livres.
  const availableUnits = useMemo(() => {
    if (!form) return [];
    const zone = OUTBOUND_ZONE[form.type];
    return units.filter(
      (u) =>
        u.status === Status.ATIVO &&
        unitZone(u) === zone &&
        (!u.outboundId || u.outboundId === form.id)
    );
  }, [form, units]);

  const saveOutbound = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    if (!form.destination.trim()) {
      toast.error(t('outbound.destinationRequired'));
      return;
    }
    const toNumber = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
    const allowed = new Set(availableUnits.map((u) => u.id));
    const body = {
      type: form.type,
      destination: form.destination.trim(),
      scheduledDate: form.scheduledDate,
      storageUnitIds: form.storageUnitIds.filter((id) => allowed.has(id)),
      weight: toNumber(form.weight),
      pieces: toNumber(form.pieces),
      notes: form.notes.trim() || null,
    };
    setIsSaving(true);
    try {
      if (form.id) await api.put(`/warehouse/outbound/${form.id}`, body);
      else await api.post('/warehouse/outbound', body);
      toast.success(t('outbound.saved'));
      setForm(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('outbound.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const closeOutbound = async (status: OutboundStatus.DONE | OutboundStatus.CANCELLED) => {
    if (!form?.id) return;
    setIsSaving(true);
    try {
      await api.patch(`/warehouse/outbound/${form.id}/status`, { status });
      toast.success(t(status === OutboundStatus.DONE ? 'outbound.done' : 'outbound.cancelled'));
      setForm(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('outbound.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const totalRatio =
    overview && overview.totalCapacityKg > 0 ? overview.totalWeightKg / overview.totalCapacityKg : 0;
  const receptions = overview?.receptions ?? [];
  const bagsToday = receptions.reduce((sum, r) => sum + r.bagsReceived, 0);
  const kgToday = receptions.reduce((sum, r) => sum + Number(r.weight), 0);

  const outboundLine = (o: WarehouseOutboundDTO) => {
    const parts: string[] = [];
    if (o.weight != null && Number(o.weight) > 0) parts.push(`${kg.format(Number(o.weight))} kg`);
    // Antes de sair, as peças são as dos lotes escolhidos.
    const pieces =
      o.pieces ?? (o.storageUnits ?? []).reduce((sum, u) => sum + (u.itemsCount ?? 0), 0);
    if (pieces) parts.push(t('outbound.pieces', { count: pieces }));
    parts.push(t(`outbound.types.${o.type}`));
    if (o.storageUnits?.length) parts.push(t('outbound.lots', { count: o.storageUnits.length }));
    return parts.join(' · ');
  };

  return (
    <div className="flex flex-col gap-5">
      {overview ? (
        <div className="flex justify-end">
          <span className="rounded-full bg-[#dceff3] px-4 py-1.5 text-[13px] font-semibold text-navy">
            {t('totalOccupancy', {
              percent: Math.round(totalRatio * 100),
              weight: kg.format(overview.totalWeightKg),
              capacity: kg.format(overview.totalCapacityKg),
            })}
          </span>
        </div>
      ) : null}

      {/* Dar entrada de sacos */}
      <form
        onSubmit={receive}
        className="flex flex-col gap-4 rounded-2xl bg-[linear-gradient(110deg,#013364_0%,#02748e_100%)] px-[22px] py-[22px] text-white lg:flex-row lg:items-center"
      >
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{t('reception.title')}</h2>
          <p className="mt-1 max-w-[420px] text-[13px] text-white/80">{t('reception.body')}</p>
        </div>
        <label className="sr-only" htmlFor="reception-code">
          {t('reception.code')}
        </label>
        <input
          id="reception-code"
          // Não é um campo de contacto: sem sugestões de gestores de palavras-passe.
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          ref={codeRef}
          autoFocus
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            // O leitor de QR termina com Enter: passa para o peso em vez de submeter.
            if (e.key === 'Enter' && code.trim() && !weight.trim()) {
              e.preventDefault();
              weightRef.current?.focus();
            }
          }}
          placeholder={t('reception.codePlaceholder')}
          className="h-[52px] w-full rounded-lg bg-white px-4 font-mono text-[15px] text-navy outline-none placeholder:text-ink/60 lg:w-[300px]"
        />
        <div className="flex h-[52px] items-center rounded-lg bg-white/15 px-4 lg:w-[150px]">
          <label className="sr-only" htmlFor="reception-weight">
            {t('reception.weight')}
          </label>
          <input
            id="reception-weight"
            // Não é um campo de contacto: sem sugestões de gestores de palavras-passe.
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            ref={weightRef}
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0,0"
            className="w-full bg-transparent text-right font-mono text-[15px] text-white outline-none placeholder:text-white/50"
          />
          <span className="ml-2 font-mono text-[15px]">kg</span>
        </div>
        <button
          type="submit"
          disabled={isReceiving}
          className="h-[52px] rounded-full bg-white px-8 text-[15px] font-semibold text-navy hover:bg-panel disabled:opacity-60"
        >
          {t('reception.submit')}
        </button>
      </form>

      {/* Zonas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(overview?.zones ?? []).map((zone) => {
          const ratio = zone.capacityKg > 0 ? zone.weightKg / zone.capacityKg : 0;
          const full = ratio >= FULL_RATIO;
          const detail =
            zone.zone === 'SORTING'
              ? t('zones.bags', { count: zone.bags ?? 0 })
              : full
                ? t('zones.shipNow')
                : t('zones.pieces', { count: zone.pieces ?? 0 });
          return (
            <section
              key={zone.zone}
              className={cn(
                'flex flex-col gap-2.5 rounded-2xl border bg-white px-4 py-4',
                full ? 'border-[#a12a1e]' : 'border-line-soft'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-navy">
                  {ZONE_LETTER[zone.zone]} · {t(`zones.names.${zone.zone}`)}
                </h3>
                <span className={cn('font-mono text-[11px]', full ? 'text-[#a12a1e]' : 'text-navy')}>
                  {Math.round(ratio * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className={cn('h-full rounded-full', full ? 'bg-[#a12a1e]' : 'bg-teal')}
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
              <p className={cn('font-mono text-[11px]', full ? 'text-[#a12a1e]' : 'text-ink')}>
                {zone.estimated ? '≈ ' : ''}
                {kg.format(zone.weightKg)} / {kg.format(zone.capacityKg)} kg · {detail}
              </p>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Entradas de hoje */}
        <section className="flex min-w-0 flex-col rounded-2xl border border-line-soft bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <h2 className="text-lg font-semibold text-navy">{t('today.title')}</h2>
            <span className="font-mono text-[11px] text-ink">
              {t('today.summary', { count: bagsToday, weight: kg.format(kgToday) })}
            </span>
          </div>
          {receptions.length === 0 ? (
            <p className="border-t border-line-soft px-4 py-6 text-center text-sm text-ink">
              {t('today.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-canvas font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
                  <tr>
                    {['time', 'request', 'route', 'bags', 'weight', 'zone', 'status'].map((col) => (
                      <th key={col} className="px-4 py-3 font-normal">
                        {t(`today.columns.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receptions.map((row) => {
                    const missing = row.bagsReceived < row.bagsLinked;
                    const waiting =
                      row.status === CollectionRequestStatus.IN_HOUSE ||
                      row.status === CollectionRequestStatus.COLLECTED;
                    return (
                      <tr key={row.collectionRequestId} className="border-t border-line-soft text-navy">
                        <td className="px-4 py-3 font-mono">
                          {format(new Date(row.receivedAt), 'HH:mm')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{row.code ?? '—'}</td>
                        <td className="px-4 py-3">
                          {[row.routeCode, row.city].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {missing ? `${row.bagsReceived}/${row.bagsLinked}` : row.bagsLinked}
                        </td>
                        <td className="px-4 py-3 font-mono">{kg.format(Number(row.weight))} kg</td>
                        <td className="px-4 py-3">{ZONE_LETTER.SORTING}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-semibold',
                              missing
                                ? 'bg-[#fbe3df] text-[#a12a1e]'
                                : waiting
                                  ? 'bg-[#dceff3] text-[#02566a]'
                                  : 'bg-mint text-forest'
                            )}
                          >
                            {missing
                              ? t('today.missing', { count: row.bagsReceived, total: row.bagsLinked })
                              : waiting
                                ? t('today.waiting')
                                : tStatus(row.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Saídas programadas */}
        <section className="flex flex-col gap-3 self-start rounded-2xl border border-line-soft bg-white p-5">
          <h2 className="text-lg font-semibold text-navy">{t('outbound.title')}</h2>
          {(overview?.outbounds ?? []).length === 0 ? (
            <p className="text-sm text-ink">{t('outbound.empty')}</p>
          ) : (
            (overview?.outbounds ?? []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => openForm(o)}
                className="flex flex-col gap-1 rounded-xl bg-canvas px-4 py-3 text-left hover:bg-panel"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-navy">{o.destination}</span>
                  <span className="shrink-0 font-mono text-[11px] text-ink">
                    {shortDate.format(new Date(`${o.scheduledDate}T12:00:00`))}
                  </span>
                </span>
                <span className="text-[13px] text-ink">{outboundLine(o)}</span>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => openForm()}
            className="mt-1 h-[44px] rounded-full border-[1.5px] border-navy text-sm font-semibold text-navy hover:bg-panel"
          >
            + {t('outbound.new')}
          </button>
        </section>
      </div>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          {form ? (
            <form onSubmit={saveOutbound} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>{t(form.id ? 'outbound.editTitle' : 'outbound.newTitle')}</DialogTitle>
                <DialogDescription>{t('outbound.formHint')}</DialogDescription>
              </DialogHeader>

              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('outbound.type')}
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as OutboundType, storageUnitIds: [] })
                  }
                  className="h-10 rounded-lg border border-field bg-white px-3"
                >
                  {Object.values(OutboundType).map((type) => (
                    <option key={type} value={type}>
                      {t(`outbound.types.${type}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('outbound.destination')}
                <input
                  value={form.destination}
                  maxLength={150}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder={t('outbound.destinationPlaceholder')}
                  className="h-10 rounded-lg border border-field px-3"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('outbound.date')}
                <input
                  type="date"
                  required
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="h-10 rounded-lg border border-field px-3"
                />
              </label>

              <fieldset className="flex flex-col gap-1.5 text-sm text-navy">
                <legend className="mb-1.5">
                  {t('outbound.units', { zone: ZONE_LETTER[OUTBOUND_ZONE[form.type]] })}
                </legend>
                {availableUnits.length === 0 ? (
                  <p className="text-xs text-ink">{t('outbound.noUnits')}</p>
                ) : (
                  <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-lg border border-field p-2">
                    {availableUnits.map((unit) => (
                      <label key={unit.id} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={form.storageUnitIds.includes(unit.id)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              storageUnitIds: e.target.checked
                                ? [...form.storageUnitIds, unit.id]
                                : form.storageUnitIds.filter((id) => id !== unit.id),
                            })
                          }
                        />
                        <span className="font-mono text-xs">{unit.friendlyCode ?? unit.id.slice(0, 8)}</span>
                        <span className="text-ink">
                          {t('outbound.unitDetail', {
                            pieces: unit.itemsCount ?? 0,
                            weight: kg.format(Number(unit.weight ?? 0)),
                          })}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm text-navy">
                  {t('outbound.weight')}
                  <input
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="h-10 rounded-lg border border-field px-3"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-navy">
                  {t('outbound.piecesLabel')}
                  <input
                    inputMode="numeric"
                    value={form.pieces}
                    onChange={(e) => setForm({ ...form, pieces: e.target.value })}
                    className="h-10 rounded-lg border border-field px-3"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('outbound.notes')}
                <textarea
                  value={form.notes}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-lg border border-field px-3 py-2"
                />
              </label>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                {form.id ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => closeOutbound(OutboundStatus.DONE)}
                      className="h-10 rounded-full bg-forest px-4 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {t('outbound.markDone')}
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => closeOutbound(OutboundStatus.CANCELLED)}
                      className="h-10 rounded-full border border-[#a12a1e] px-4 text-sm font-semibold text-[#a12a1e] disabled:opacity-60"
                    >
                      {t('outbound.cancel')}
                    </button>
                  </div>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {t('outbound.save')}
                </button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
