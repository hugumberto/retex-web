'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

type Ring = [number, number][];
type Feature = {
  properties: { name: string; code: string; short?: string };
  geometry: { type: 'MultiPolygon'; coordinates: Ring[][] };
};
type IndexEntry = { name: string; code: string; district: string; dt: string };

/** Um pedido pendente ou uma paragem de rota, reduzido ao que o mapa precisa. */
export type MapItem = {
  city?: string | null;
  /** Freguesia (vem da TomTom; pode não coincidir com o nome oficial). */
  parish?: string | null;
  pending: boolean;
  stale: boolean;
  /** Etiqueta da rota do dia (R1, R2…), nas paragens. */
  route?: string;
};

type Level =
  | { kind: 'districts' }
  | { kind: 'municipalities'; dt: string; name: string }
  | { kind: 'parishes'; dt: string; district: string; code: string; name: string };

// Limites oficiais (CAOP2025, DGT), simplificados e guardados no portal.
const URL_FOR = (level: Level) =>
  level.kind === 'districts'
    ? '/geo/distritos.json'
    : level.kind === 'municipalities'
      ? `/geo/municipios/${level.dt}.json`
      : `/geo/freguesias/${level.code}.json`;

const WIDTH = 600;
const HEIGHT = 470;
const PAD = 16;
// Acima disto, só se escreve o nome das áreas com pedidos ou rotas.
const MAX_LABELS = 30;

export const normalizeName = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Escala igual ao design: 0, 1–2, 3–5, 6–8, 9+.
export const BUCKETS = [
  { min: 0, fill: '#f1f5f6', text: '#4a6070' },
  { min: 1, fill: '#cce3e8', text: '#013364' },
  { min: 3, fill: '#7fb6c6', text: '#013364' },
  { min: 6, fill: '#02748e', text: '#ffffff' },
  { min: 9, fill: '#013364', text: '#ffffff' },
];
const bucketOf = (n: number) => [...BUCKETS].reverse().find((b) => n >= b.min) ?? BUCKETS[0];

// A freguesia da morada vem da TomTom ("Nogueira e Silva Escura"), a da CAOP
// pode ser uma união ("União das freguesias de Nogueira e Silva Escura"):
// conta se um nome contiver o outro.
const parishMatches = (feature: Feature, parish: string) => {
  const names = [feature.properties.name, feature.properties.short].map(normalizeName).filter(Boolean);
  return names.some((n) => n === parish || n.includes(parish) || parish.includes(n));
};

type Stats = { pending: number; stale: boolean; routes: string[] };

/**
 * Mapa dos pedidos pendentes com três níveis: distritos → concelhos de um
 * distrito → freguesias de um concelho. Clicar numa área desce um nível; o
 * caminho no topo volta atrás.
 */
export default function AreaMap({
  items,
  warehouse,
}: {
  items: MapItem[];
  warehouse: { lat: number; long: number } | null;
}) {
  const t = useTranslations('packageCollection.day.map');
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [level, setLevel] = useState<Level>({ kind: 'districts' });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    fetch('/geo/municipios-index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  // Abre, uma única vez, no distrito com mais pedidos pendentes: é onde a
  // operação está. Sem pedidos, fica nos distritos.
  useEffect(() => {
    if (opened || index.length === 0 || items.length === 0) return;
    const byCity = new Map(index.map((e) => [normalizeName(e.name), e]));
    const counts = new Map<string, { entry: IndexEntry; n: number }>();
    items
      .filter((item) => item.pending)
      .forEach((item) => {
        const entry = byCity.get(normalizeName(item.city));
        if (!entry) return;
        const current = counts.get(entry.dt) ?? { entry, n: 0 };
        counts.set(entry.dt, { entry, n: current.n + 1 });
      });
    const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
    if (top) setLevel({ kind: 'municipalities', dt: top.entry.dt, name: top.entry.district });
    setOpened(true);
  }, [index, items, opened]);

  useEffect(() => {
    let cancelled = false;
    setFeatures([]);
    fetch(URL_FOR(level))
      .then((r) => r.json())
      .then((d: { features: Feature[] }) => {
        if (!cancelled) setFeatures(d.features);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  const districtOfCity = useMemo(
    () => new Map(index.map((e) => [normalizeName(e.name), normalizeName(e.district)])),
    [index]
  );

  // Contagens por área do nível atual.
  const stats = useMemo(() => {
    const map = new Map<number, Stats>();
    const add = (i: number, item: MapItem) => {
      const entry = map.get(i) ?? { pending: 0, stale: false, routes: [] };
      if (item.pending) entry.pending += 1;
      if (item.stale) entry.stale = true;
      if (item.route && !entry.routes.includes(item.route)) entry.routes.push(item.route);
      map.set(i, entry);
    };
    const keys = features.map((f) => normalizeName(f.properties.name));
    items.forEach((item) => {
      const city = normalizeName(item.city);
      if (level.kind === 'districts') {
        const i = keys.indexOf(districtOfCity.get(city) ?? '');
        if (i >= 0) add(i, item);
      } else if (level.kind === 'municipalities') {
        const i = keys.indexOf(city);
        if (i >= 0) add(i, item);
      } else if (city === normalizeName(level.name)) {
        const parish = normalizeName(item.parish);
        const i = parish ? features.findIndex((f) => parishMatches(f, parish)) : -1;
        if (i >= 0) add(i, item);
      }
    });
    return map;
  }, [items, features, level, districtOfCity]);

  const unplaced =
    level.kind === 'parishes'
      ? items.filter(
          (item) =>
            item.pending &&
            normalizeName(item.city) === normalizeName(level.name) &&
            !features.some((f) => item.parish && parishMatches(f, normalizeName(item.parish)))
        ).length
      : 0;

  const projection = useMemo(() => {
    const points = features.flatMap((f) => f.geometry.coordinates.flat(2));
    if (points.length === 0) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
    const scale = Math.min((WIDTH - 2 * PAD) / ((maxX - minX) * k), (HEIGHT - 2 * PAD) / (maxY - minY));
    // Centra a forma no quadro.
    const offX = (WIDTH - (maxX - minX) * k * scale) / 2;
    const offY = (HEIGHT - (maxY - minY) * scale) / 2;
    return {
      project: ([lon, lat]: [number, number]): [number, number] => [
        offX + (lon - minX) * k * scale,
        offY + (maxY - lat) * scale,
      ],
      inside: (lon: number, lat: number) => lon >= minX && lon <= maxX && lat >= minY && lat <= maxY,
    };
  }, [features]);

  const shapes = useMemo(() => {
    if (!projection) return [];
    return features.map((f) => {
      const d = f.geometry.coordinates
        .map((poly) =>
          poly
            .map((ring) => `M${ring.map((p) => projection.project(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`)
            .join('')
        )
        .join('');
      const largest = [...f.geometry.coordinates].sort((a, b) => b[0].length - a[0].length)[0][0];
      const [cx, cy] = largest
        .map(projection.project)
        .reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
        .map((v) => v / largest.length);
      return { feature: f, d, cx, cy };
    });
  }, [features, projection]);

  const drill = (feature: Feature) => {
    if (level.kind === 'districts') {
      setLevel({ kind: 'municipalities', dt: feature.properties.code, name: feature.properties.name });
    } else if (level.kind === 'municipalities') {
      setLevel({
        kind: 'parishes',
        dt: level.dt,
        district: level.name,
        code: feature.properties.code,
        name: feature.properties.name,
      });
    }
  };

  const crumbs: { label: string; to?: Level }[] = [
    { label: t('country'), to: level.kind === 'districts' ? undefined : { kind: 'districts' } },
  ];
  if (level.kind === 'municipalities') crumbs.push({ label: level.name });
  if (level.kind === 'parishes') {
    crumbs.push({ label: level.district, to: { kind: 'municipalities', dt: level.dt, name: level.district } });
    crumbs.push({ label: level.name });
  }

  const showAllLabels = shapes.length <= MAX_LABELS;
  const wh = warehouse && projection?.inside(warehouse.long, warehouse.lat) ? projection.project([warehouse.long, warehouse.lat]) : null;
  const clickable = level.kind !== 'parishes';

  return (
    <div className="flex flex-col gap-2">
      <nav aria-label={t('levels')} className="flex flex-wrap items-center gap-1 text-xs text-ink">
        {crumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1">
            {i > 0 ? <span aria-hidden>›</span> : null}
            {crumb.to ? (
              <button
                type="button"
                onClick={() => setLevel(crumb.to as Level)}
                className="font-semibold text-teal underline underline-offset-2"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="font-semibold text-navy">{crumb.label}</span>
            )}
          </span>
        ))}
        <span className="ml-auto text-[11px]">
          {clickable ? t(level.kind === 'districts' ? 'hintDistricts' : 'hintMunicipalities') : null}
        </span>
      </nav>

      {!projection ? (
        <div className="h-[470px] w-full animate-pulse rounded-xl bg-mist" />
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[470px] w-full rounded-xl bg-mist"
          role="img"
          aria-label={t(`aria.${level.kind}`)}
        >
          {shapes.map(({ feature, d }, i) => {
            const s = stats.get(i);
            const bucket = bucketOf(s?.pending ?? 0);
            return (
              <path
                key={feature.properties.code}
                d={d}
                fill={bucket.fill}
                stroke={s?.stale ? '#a12a1e' : '#ffffff'}
                strokeWidth={s?.stale ? 1.4 : 1}
                strokeDasharray={s?.stale ? '3 2' : undefined}
                className={cn(clickable && 'cursor-pointer hover:opacity-80')}
                onClick={clickable ? () => drill(feature) : undefined}
              >
                <title>{`${feature.properties.name}: ${s?.pending ?? 0}`}</title>
              </path>
            );
          })}
          {shapes.map(({ feature, cx, cy }, i) => {
            const s = stats.get(i);
            const pending = s?.pending ?? 0;
            const active = pending > 0 || (s?.routes.length ?? 0) > 0;
            if (!showAllLabels && !active) return null;
            const bucket = bucketOf(pending);
            const name = feature.properties.short ?? feature.properties.name;
            return (
              <g key={`label-${feature.properties.code}`} transform={`translate(${cx},${cy})`} pointerEvents="none">
                <text textAnchor="middle" y={-4} fontSize={active ? 9 : 8} fontWeight={active ? 600 : 400} fill={active ? bucket.text : '#4a6070'}>
                  {name.length > 28 ? `${name.slice(0, 26)}…` : name}
                </text>
                <text textAnchor="middle" y={10} fontSize={active ? 13 : 10} fontWeight={500} fill={active ? bucket.text : '#4a6070'}>
                  {pending > 0 ? pending : '—'}
                </text>
                {(s?.routes ?? []).map((label, r) => (
                  <g key={label} transform={`translate(${14 + r * 18},6)`}>
                    <rect x={-8} y={-6} width={16} height={9} rx={4.5} fill="#fff" stroke="#013364" strokeWidth={0.8} />
                    <text textAnchor="middle" y={1} fontSize={7} fill="#013364" fontFamily="var(--font-dm-mono)">
                      {label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
          {wh ? (
            <rect x={wh[0] - 6} y={wh[1] - 6} width={12} height={12} rx={2} fill="#fff" stroke="#013364" strokeWidth={1.5} pointerEvents="none">
              <title>{t('warehouse')}</title>
            </rect>
          ) : null}
        </svg>
      )}

      {unplaced > 0 ? (
        <p className="text-[11px] text-ink">{t('unplaced', { count: unplaced })}</p>
      ) : null}
    </div>
  );
}
