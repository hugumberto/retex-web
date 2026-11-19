'use client';

import { useEffect, useMemo, useState } from 'react';

type Ring = [number, number][];
type Feature = {
  properties: { name: string; code: string };
  geometry: { type: 'MultiPolygon'; coordinates: Ring[][] };
};

export type CityInfo = {
  pending: number;
  /** Há pedidos pendentes há mais de 48 h. */
  stale: boolean;
  /** Etiquetas das rotas do dia com paragens neste concelho (R1, R2…). */
  routes: string[];
};

// Concelhos do distrito do Porto (CAOP2025, DGT), simplificados para o portal.
const GEO_URL = '/geo/porto-concelhos.json';
const WIDTH = 600;
const HEIGHT = 470;
const PAD = 16;

export const normalizeCity = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

/**
 * Mapa coroplético dos pedidos pendentes por concelho. Projeção equiretangular
 * corrigida pela latitude: num distrito chega e evita uma biblioteca de mapas.
 */
export default function DistrictMap({
  byCity,
  warehouse,
}: {
  byCity: Map<string, CityInfo>;
  warehouse: { lat: number; long: number } | null;
}) {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((d: { features: Feature[] }) => setFeatures(d.features))
      .catch(() => setFeatures([]));
  }, []);

  const projection = useMemo(() => {
    const points = features.flatMap((f) => f.geometry.coordinates.flat(2));
    if (points.length === 0) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
    const scale = Math.min(
      (WIDTH - 2 * PAD) / ((maxX - minX) * k),
      (HEIGHT - 2 * PAD) / (maxY - minY)
    );
    return ([lon, lat]: [number, number]): [number, number] => [
      PAD + (lon - minX) * k * scale,
      PAD + (maxY - lat) * scale,
    ];
  }, [features]);

  const shapes = useMemo(() => {
    if (!projection) return [];
    return features.map((f) => {
      const d = f.geometry.coordinates
        .map((poly) =>
          poly
            .map((ring) => `M${ring.map((p) => projection(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`)
            .join('')
        )
        .join('');
      // Etiqueta no centro do maior polígono (média dos vértices: chega aqui).
      const largest = [...f.geometry.coordinates].sort((a, b) => b[0].length - a[0].length)[0][0];
      const [cx, cy] = largest
        .map(projection)
        .reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
        .map((v) => v / largest.length);
      return { name: f.properties.name, d, cx, cy };
    });
  }, [features, projection]);

  if (!projection) {
    return <div className="h-[470px] w-full animate-pulse rounded-xl bg-mist" />;
  }

  const wh = warehouse ? projection([warehouse.long, warehouse.lat]) : null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      // Altura fixa do design; a forma do distrito ajusta-se dentro dela.
      preserveAspectRatio="xMidYMid meet"
      className="h-[470px] w-full rounded-xl bg-mist"
      role="img"
      aria-label="Pedidos pendentes por concelho"
    >
      {shapes.map((s) => {
        const info = byCity.get(normalizeCity(s.name));
        const bucket = bucketOf(info?.pending ?? 0);
        return (
          <path
            key={s.name}
            d={s.d}
            fill={bucket.fill}
            stroke={info?.stale ? '#a12a1e' : '#ffffff'}
            strokeWidth={info?.stale ? 1.4 : 1}
            strokeDasharray={info?.stale ? '3 2' : undefined}
          >
            <title>{`${s.name}: ${info?.pending ?? 0}`}</title>
          </path>
        );
      })}
      {shapes.map((s) => {
        const info = byCity.get(normalizeCity(s.name));
        const pending = info?.pending ?? 0;
        const bucket = bucketOf(pending);
        const active = pending > 0 || (info?.routes.length ?? 0) > 0;
        return (
          <g key={`label-${s.name}`} transform={`translate(${s.cx},${s.cy})`} pointerEvents="none">
            <text
              textAnchor="middle"
              y={-4}
              fontSize={active ? 9 : 8}
              fontWeight={active ? 600 : 400}
              fill={active ? bucket.text : '#4a6070'}
            >
              {s.name}
            </text>
            <text
              textAnchor="middle"
              y={10}
              fontSize={active ? 13 : 10}
              fontWeight={500}
              fill={active ? bucket.text : '#4a6070'}
            >
              {pending > 0 ? pending : '—'}
            </text>
            {(info?.routes ?? []).map((label, i) => (
              <g key={label} transform={`translate(${14 + i * 18},6)`}>
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
        <rect
          x={wh[0] - 6}
          y={wh[1] - 6}
          width={12}
          height={12}
          rx={2}
          fill="#fff"
          stroke="#013364"
          strokeWidth={1.5}
        >
          <title>Armazém</title>
        </rect>
      ) : null}
    </svg>
  );
}
