'use client';

import {
  TriageExportRow,
  TriageOverview as Overview,
  TriageOverviewAlert,
  TriageOverviewQueueEntry,
  TriageStationStatus,
} from '@/app/types/triage-overview';
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
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// O painel volta a pedir os dados a cada 10 s.
const REFRESH_MS = 10_000;
// A partir daqui o pedido à espera fica a vermelho.
const LATE_DAYS = 7;

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Supervisão da triagem (Figma 12-Admin-Triagem). A triagem em si faz-se no modo Posto. */
export default function TriageOverview() {
  const t = useTranslations('triageOverview');
  const tDestination = useTranslations('enums.destination');
  const tCategory = useTranslations('enums.category');
  const tCondition = useTranslations('enums.condition');
  const tSeason = useTranslations('enums.season');
  const tSex = useTranslations('enums.sex');
  const tAgeGroup = useTranslations('enums.ageGroup');
  const locale = useLocale();
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [exporting, setExporting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRequest, setAssignRequest] = useState<string>('');
  const [assignStation, setAssignStation] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const number = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : `${locale}-PT`);
  const decimal = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : `${locale}-PT`, { maximumFractionDigits: 2 });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Overview>('/triage/overview');
      setOverview(data);
      setLoadedAt(Date.now());
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('title'));
    setBreadcrumbs([]);
    load();
    const refresh = window.setInterval(load, REFRESH_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [load, setPageTitle, setBreadcrumbs, t]);

  const exportDay = async () => {
    setExporting(true);
    try {
      const { data } = await api.get<TriageExportRow[]>('/triage/export');
      const columns = [
        'time', 'station', 'operator', 'request', 'client', 'bag', 'quantity',
        'destination', 'category', 'condition', 'sex', 'ageGroup', 'season', 'brand', 'lot',
      ] as const;
      const enumOr = (fn: (k: string) => string, value: string | null) => (value ? fn(value) : '');
      const lines = [
        columns.map((c) => csvCell(t(`csv.${c}`))).join(';'),
        ...data.map((r) =>
          [
            format(new Date(r.createdAt), 'HH:mm:ss'),
            r.station ?? '',
            r.operatorName,
            r.requestCode,
            r.clientName,
            r.bagCode,
            r.quantity,
            enumOr(tDestination, r.destination),
            enumOr(tCategory, r.category),
            enumOr(tCondition, r.condition),
            enumOr(tSex, r.sex),
            enumOr(tAgeGroup, r.ageGroup),
            enumOr(tSeason, r.season),
            r.brand,
            r.storageUnitCode,
          ]
            .map(csvCell)
            .join(';')
        ),
      ];
      // BOM para o Excel abrir os acentos bem.
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `triagem-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      if (data.length === 0) toast.info(t('csv.empty'));
    } catch {
      toast.error(t('csv.error'));
    } finally {
      setExporting(false);
    }
  };

  const openAssign = (entry?: TriageOverviewQueueEntry) => {
    const first = entry ?? overview?.queue[0];
    setAssignRequest(first?.id ?? '');
    setAssignStation(first?.assignedStation ?? null);
    setAssignOpen(true);
  };

  const saveAssign = async () => {
    if (!assignRequest) return;
    setAssigning(true);
    try {
      const current = overview?.queue.find((q) => q.id === assignRequest)?.assignedStation ?? null;
      if (assignStation) {
        await api.post(`/triage/station/${assignStation}/assign`, { collectionRequestId: assignRequest });
      } else if (current) {
        await api.post(`/triage/station/${current}/assign`, { collectionRequestId: null });
      }
      setAssignOpen(false);
      toast.success(assignStation ? t('assign.done', { n: assignStation }) : t('assign.removed'));
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('assign.error')));
    } finally {
      setAssigning(false);
    }
  };

  const k = overview?.kpis;
  const total = overview
    ? overview.destinations.reuse + overview.destinations.upcycling + overview.destinations.nonReusable
    : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const secondsAgo = loadedAt ? Math.max(0, Math.round((now - loadedAt) / 1000)) : null;

  const kpiCard = (label: string, value: React.ReactNode, hint: React.ReactNode, highlight = false) => (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-2xl px-4 py-4',
        highlight
          ? 'bg-[linear-gradient(110deg,#013364_0%,#02748e_100%)] text-white'
          : 'border border-line-soft bg-white text-navy'
      )}
    >
      <span className={cn('font-mono text-[10px] uppercase tracking-[0.08em]', highlight ? 'text-white/75' : 'text-ink')}>
        {label}
      </span>
      <span className="text-[28px] font-bold leading-tight">{value}</span>
      <span className={cn('text-xs', highlight ? 'text-white/80' : 'text-ink')}>{hint}</span>
    </div>
  );

  const statusBadge = (status: TriageStationStatus) => (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
        status === TriageStationStatus.SORTING && 'bg-mint text-forest',
        status === TriageStationStatus.PAUSED && 'bg-neutral-badge text-ink',
        status === TriageStationStatus.FREE && 'bg-sky text-navy'
      )}
    >
      {t(`stations.status.${status}`)}
    </span>
  );

  const alertLine = (alert: TriageOverviewAlert) => {
    if (alert.type === 'UNBOXED_LOT') {
      return {
        title: t('alerts.unboxed', { n: alert.station }),
        body: `${alert.lot.label} · ${t('pieces', { count: alert.lot.pieces })}`,
        tone: 'bg-[#a12a1e]',
      };
    }
    if (alert.type === 'WRONG_BAG') {
      return {
        title: alert.otherRequestCode
          ? t('alerts.wrongBag', { n: alert.station })
          : t('alerts.unknownBagTitle', { n: alert.station }),
        body: `${
          alert.otherRequestCode
            ? t('alerts.belongsTo', { bag: alert.code, request: alert.otherRequestCode })
            : t('alerts.unknownBag', { bag: alert.code })
        } · ${format(new Date(alert.at), 'HH:mm')}`,
        tone: 'bg-[#a12a1e]',
      };
    }
    return {
      title: t('alerts.waiting', { days: alert.waitingDays }),
      body: [alert.code, alert.clientName].filter(Boolean).join(' · '),
      tone: 'bg-navy',
    };
  };

  const segments = overview
    ? [
        { key: 'reuse', value: overview.destinations.reuse, color: 'bg-teal', dot: 'bg-teal' },
        { key: 'upcycling', value: overview.destinations.upcycling, color: 'bg-[#5fa3b3]', dot: 'bg-[#5fa3b3]' },
        { key: 'nonReusable', value: overview.destinations.nonReusable, color: 'bg-forest', dot: 'bg-forest' },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-ink">{t('subtitle')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportDay}
            disabled={exporting}
            className="h-11 rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-semibold text-navy hover:bg-panel disabled:opacity-50"
          >
            {t('export')}
          </button>
          <Link
            href="/portal/triage/posto"
            className="flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            {t('openStation')}
          </Link>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpiCard(
          t('kpis.pieces'),
          k ? number.format(k.pieces) : '—',
          k ? t('kpis.piecesHint', { count: k.activeStations }) : '',
          true
        )}
        {kpiCard(
          t('kpis.weight'),
          k ? (
            <>
              {number.format(Math.round(k.weightKg))} <span className="text-base">kg</span>
            </>
          ) : (
            '—'
          ),
          k?.kgPerPiece ? t('kpis.weightHint', { kg: decimal.format(k.kgPerPiece) }) : t('kpis.weightNone')
        )}
        {kpiCard(
          t('kpis.rhythm'),
          k?.avgRhythm != null ? (
            <>
              {k.avgRhythm} <span className="text-base">{t('perHour')}</span>
            </>
          ) : (
            '—'
          ),
          overview ? t('kpis.rhythmHint', { target: overview.targetPerHour }) : ''
        )}
        {kpiCard(t('kpis.bags'), k ? number.format(k.bagsToSort) : '—', t('kpis.bagsHint'))}
        {kpiCard(
          t('kpis.done'),
          k ? number.format(k.requestsDone) : '—',
          k?.lastDoneAt ? t('kpis.doneHint', { time: format(new Date(k.lastDoneAt), 'HH:mm') }) : t('kpis.doneNone')
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Postos */}
        <section className="flex min-w-0 flex-col rounded-2xl border border-line-soft bg-white px-5 py-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy">{t('stations.title')}</h2>
            {secondsAgo !== null ? (
              <span className="font-mono text-[11px] text-ink">{t('stations.updated', { seconds: secondsAgo })}</span>
            ) : null}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-navy">
              <thead className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
                <tr>
                  {['station', 'request', 'bags', 'pieces', 'rhythm', 'status'].map((col) => (
                    <th key={col} className="pb-3 pr-3 font-normal">
                      {t(`stations.columns.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(overview?.stations ?? []).map((s) => (
                  <tr key={s.number} className="border-t border-line-soft">
                    <td className="py-3.5 pr-3">
                      <p className="font-semibold">{t('stations.station', { n: s.number })}</p>
                      <p className="text-xs text-ink">{s.operatorName ?? t('stations.noOperator')}</p>
                    </td>
                    <td className="py-3.5 pr-3">
                      {s.request ? (
                        <>
                          <p className="font-mono">{s.request.code}</p>
                          <p className="text-xs text-ink">{s.request.clientName ?? '—'}</p>
                        </>
                      ) : s.assigned ? (
                        <>
                          <p className="font-mono text-ink">{s.assigned.code}</p>
                          <p className="text-xs text-teal">{t('stations.assigned')}</p>
                        </>
                      ) : (
                        <span className="text-ink">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-3 font-mono">
                      {s.request ? `${s.request.bagsProcessed} / ${s.request.bags}` : '—'}
                    </td>
                    <td className="py-3.5 pr-3 font-mono">{s.request ? number.format(s.request.pieces) : '—'}</td>
                    <td className="py-3.5 pr-3 font-mono">
                      {s.rhythm != null && s.request ? `${s.rhythm}/h` : '—'}
                    </td>
                    <td className="py-3.5">{statusBadge(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fila */}
        <section className="flex flex-col rounded-2xl border border-line-soft bg-white px-5 py-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
            <h2 className="text-lg font-semibold text-navy">{t('queue.title')}</h2>
            <span className="font-mono text-[11px] text-ink">{t('queue.order')}</span>
          </div>
          {overview && overview.queue.length === 0 ? (
            <p className="py-6 text-sm text-ink">{t('queue.empty')}</p>
          ) : null}
          <div className="flex max-h-[420px] flex-col overflow-y-auto">
            {(overview?.queue ?? []).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => openAssign(q)}
                className="flex items-center justify-between gap-3 border-b border-line-soft py-3 text-left hover:bg-mist"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-navy">{q.code}</p>
                  <p className="truncate text-[13px] font-semibold text-navy">{q.clientName ?? '—'}</p>
                  <p className="text-xs text-ink">
                    {[
                      t('bags', { count: q.bags }),
                      q.collectedAt
                        ? t('queue.collectedOn', { date: format(new Date(q.collectedAt), 'dd/MM') })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {q.waitingDays != null ? (
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        q.waitingDays >= LATE_DAYS ? 'bg-[#fbecea] text-[#a12a1e]' : 'bg-neutral-badge text-ink'
                      )}
                    >
                      {t('queue.waiting', { days: q.waitingDays })}
                    </span>
                  ) : null}
                  {q.assignedStation ? (
                    <span className="rounded-full bg-teal px-2.5 py-1 text-[11px] font-semibold text-white">
                      {t('stations.station', { n: q.assignedStation })}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
          {overview && overview.queue.length > 0 ? (
            <button
              type="button"
              onClick={() => openAssign()}
              className="mt-4 h-10 self-start rounded-full border-[1.5px] border-navy px-5 text-sm font-semibold text-navy hover:bg-panel"
            >
              {t('queue.assign')}
            </button>
          ) : null}
        </section>

        {/* Destino das peças */}
        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line-soft bg-white px-5 py-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy">{t('destinations.title')}</h2>
            <span className="font-mono text-[11px] text-ink">{t('pieces', { count: total })}</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-neutral-badge">
            {segments.map((s) =>
              s.value > 0 ? (
                <div key={s.key} className={s.color} style={{ width: `${(s.value / total) * 100}%` }} />
              ) : null
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {segments.map((s) => (
              <div key={s.key} className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-xs text-ink">
                  <span className={cn('size-2 rounded-full', s.dot)} />
                  {t(`destinations.${s.key}`)}
                </span>
                <span className="text-[22px] font-bold text-navy">{pct(s.value)}%</span>
                <span className="font-mono text-[11px] text-ink">{t('pieces', { count: s.value })}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink">
            {[
              t('destinations.accessories', { count: k?.accessories ?? 0 }),
              overview?.daysToClearSorting ? t('destinations.clearIn', { count: overview.daysToClearSorting }) : null,
            ]
              .filter(Boolean)
              .join(' ')}
          </p>
        </section>

        {/* Alertas */}
        <section className="flex flex-col rounded-2xl border border-line-soft bg-white px-5 py-5">
          <h2 className="border-b border-line-soft pb-3 text-lg font-semibold text-navy">{t('alerts.title')}</h2>
          {overview && overview.alerts.length === 0 ? (
            <p className="py-6 text-sm text-ink">{t('alerts.none')}</p>
          ) : null}
          {(overview?.alerts ?? []).map((alert, index) => {
            const line = alertLine(alert);
            return (
              <div key={index} className="flex gap-2.5 border-b border-line-soft py-3 last:border-b-0">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', line.tone)} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-navy">{line.title}</p>
                  <p className="truncate text-xs text-ink">{line.body}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('assign.title')}</DialogTitle>
            <DialogDescription>{t('assign.body')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              {t('assign.request')}
              <select
                value={assignRequest}
                onChange={(e) => {
                  setAssignRequest(e.target.value);
                  setAssignStation(overview?.queue.find((q) => q.id === e.target.value)?.assignedStation ?? null);
                }}
                className="h-11 rounded-lg border border-field bg-white px-3 font-normal"
              >
                {(overview?.queue ?? []).map((q) => (
                  <option key={q.id} value={q.id}>
                    {[q.code, q.clientName].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-navy">{t('assign.station')}</span>
              <div className="flex flex-wrap gap-2">
                {(overview?.stations ?? []).map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => setAssignStation(s.number)}
                    className={cn(
                      'flex h-14 min-w-[92px] flex-col items-center justify-center rounded-xl border-[1.5px] px-3 text-sm',
                      assignStation === s.number ? 'border-navy bg-navy text-white' : 'border-line-soft text-navy hover:bg-panel'
                    )}
                  >
                    <span className="font-semibold">{t('stations.station', { n: s.number })}</span>
                    <span className={cn('text-[11px]', assignStation === s.number ? 'text-white/80' : 'text-ink')}>
                      {s.operatorName ?? t('stations.noOperator')}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAssignStation(null)}
                  className={cn(
                    'flex h-14 min-w-[92px] items-center justify-center rounded-xl border-[1.5px] px-3 text-sm',
                    assignStation === null ? 'border-navy bg-navy text-white' : 'border-line-soft text-navy hover:bg-panel'
                  )}
                >
                  {t('assign.none')}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="h-10 rounded-full border-[1.5px] border-navy px-5 text-sm font-semibold text-navy"
            >
              {t('assign.cancel')}
            </button>
            <button
              type="button"
              onClick={saveAssign}
              disabled={assigning || !assignRequest}
              className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t('assign.save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
