'use client';

import { CollectionRequestDTO } from '@/app/types/collection-request';
import { SystemParameterDTO } from '@/app/types/system-parameter';
import api from '@/lib/api';
import ttServices from '@tomtom-international/web-sdk-services';
import type { FeatureCollection } from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { hasValidCoords, readCoords } from '../package-collection/utils';

export type PlannedStop = {
  request: CollectionRequestDTO;
  /** Minutos desde a saída do armazém até chegar a esta paragem. */
  arrivalMinutes: number | null;
};

export type PlanResult = {
  /** Paragens pela ordem do percurso (as sem coordenadas vão no fim). */
  stops: PlannedStop[];
  distanceKm: number | null;
  /** Condução + tempo de cada recolha, ida e volta ao armazém. */
  totalMinutes: number | null;
  geoJson: FeatureCollection | null;
  error: 'noWarehouse' | 'routing' | null;
};

export type RoutePlan = PlanResult & {
  warehouse: { lat: number; long: number } | null;
  isLoading: boolean;
};

type Leg = { summary: { travelTimeInSeconds: number } };
type RouteResponse = {
  routes?: { summary: { lengthInMeters: number }; legs: Leg[] }[];
  optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
  toGeoJson: () => FeatureCollection;
};

// Espera que a seleção estabilize antes de pedir o percurso (cada pedido conta
// para a quota da TomTom).
const DEBOUNCE_MS = 600;

const toNumber = (value: unknown) => {
  const n = Number(value);
  return value === null || value === undefined || value === '' || !Number.isFinite(n)
    ? null
    : n;
};

export const warehouseOf = (params: SystemParameterDTO | null) => {
  const lat = toNumber(params?.warehouseLat);
  const long = toNumber(params?.warehouseLong);
  return lat !== null && long !== null ? { lat, long } : null;
};

const fallback = (
  requests: CollectionRequestDTO[],
  error: PlanResult['error']
): PlanResult => ({
  stops: requests.map((request) => ({ request, arrivalMinutes: null })),
  distanceKm: null,
  totalMinutes: null,
  geoJson: null,
  error,
});

/**
 * Percurso de uma rota: parte do armazém, passa pelas paragens e volta. Com
 * `optimize`, a TomTom escolhe a melhor ordem; sem ele mantém-se a ordem dada
 * (uma rota já agendada). A hora de cada paragem soma a condução e o tempo das
 * recolhas anteriores (fixo + por saco, em Parâmetros).
 */
export async function calculatePlan(
  requests: CollectionRequestDTO[],
  params: SystemParameterDTO | null,
  { optimize = true }: { optimize?: boolean } = {}
): Promise<PlanResult> {
  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  const warehouse = warehouseOf(params);
  if (requests.length === 0) return fallback(requests, null);
  if (!warehouse || !apiKey) return fallback(requests, params ? 'noWarehouse' : null);

  const located = requests.filter(hasValidCoords);
  const unlocated = requests.filter((r) => !hasValidCoords(r));
  if (located.length === 0) return fallback(requests, null);

  try {
    const response = (await ttServices.services.calculateRoute({
      key: apiKey,
      locations: [
        [warehouse.long, warehouse.lat],
        ...located.map((r) => {
          const { lat, long } = readCoords(r);
          return [long, lat];
        }),
        [warehouse.long, warehouse.lat],
      ],
      // Otimiza só as paragens: o armazém é sempre o início e o fim.
      computeBestOrder: optimize && located.length >= 2,
      traffic: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as RouteResponse;

    const route = response.routes?.[0];
    if (!route) throw new Error('sem rota');

    const order = response.optimizedWaypoints?.length
      ? [...response.optimizedWaypoints]
          .sort((a, b) => a.optimizedIndex - b.optimizedIndex)
          .map((wp) => located[wp.providedIndex])
      : located;

    const base = params?.stopBaseMinutes ?? 5;
    const perBag = params?.stopMinutesPerBag ?? 1;
    let minutes = 0;
    const stops: PlannedStop[] = order.map((request, index) => {
      minutes += route.legs[index].summary.travelTimeInSeconds / 60;
      const arrivalMinutes = Math.round(minutes);
      minutes += base + perBag * (request.estimatedBags ?? 0);
      return { request, arrivalMinutes };
    });
    minutes += route.legs[order.length].summary.travelTimeInSeconds / 60;

    return {
      stops: [...stops, ...unlocated.map((request) => ({ request, arrivalMinutes: null }))],
      distanceKm: route.summary.lengthInMeters / 1000,
      totalMinutes: Math.round(minutes),
      geoJson: response.toGeoJson(),
      error: null,
    };
  } catch {
    return fallback(requests, 'routing');
  }
}

/** Parâmetros de sistema (armazém e tempos por paragem), lidos uma vez. */
export function useSystemParameters() {
  const [params, setParams] = useState<SystemParameterDTO | null>(null);
  useEffect(() => {
    api
      .get<SystemParameterDTO>('/system-parameter')
      .then(({ data }) => setParams(data))
      .catch(() => setParams(null));
  }, []);
  return params;
}

/** Percurso da rota em construção no painel "Nova rota". */
export function useRoutePlan(requests: CollectionRequestDTO[]): RoutePlan {
  const params = useSystemParameters();
  const [result, setResult] = useState<PlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const warehouse = useMemo(() => warehouseOf(params), [params]);
  const key = requests.map((r) => r.id).join(',');

  useEffect(() => {
    if (requests.length === 0) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const plan = await calculatePlan(requests, params);
      if (!cancelled) {
        setResult(plan);
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` resume `requests`, que muda de identidade a cada render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, params]);

  const base = result ?? fallback(requests, null);
  return { ...base, warehouse, isLoading };
}

/** "09:00 - 13:00" + 80 min → "10:20". */
export function clockAfter(interval: string, minutes: number): string | null {
  const match = /^(\d{2}):(\d{2})/.exec(interval);
  if (!match) return null;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
