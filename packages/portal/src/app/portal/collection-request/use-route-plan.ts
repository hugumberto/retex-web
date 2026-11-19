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

export type RoutePlan = {
  /** Paragens pela ordem do percurso (as sem coordenadas vão no fim). */
  stops: PlannedStop[];
  distanceKm: number | null;
  /** Condução + tempo de cada recolha, ida e volta ao armazém. */
  totalMinutes: number | null;
  geoJson: FeatureCollection | null;
  warehouse: { lat: number; long: number } | null;
  isLoading: boolean;
  error: 'noWarehouse' | 'routing' | null;
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

/**
 * Percurso da rota em construção: parte do armazém, passa pelas paragens pela
 * melhor ordem (TomTom Routing) e volta. A hora de cada paragem soma a condução
 * e o tempo das recolhas anteriores (fixo + por saco, em Parâmetros).
 */
export function useRoutePlan(requests: CollectionRequestDTO[]): RoutePlan {
  const [params, setParams] = useState<SystemParameterDTO | null>(null);
  const [result, setResult] = useState<Omit<RoutePlan, 'isLoading' | 'warehouse'> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api
      .get<SystemParameterDTO>('/system-parameter')
      .then(({ data }) => setParams(data))
      .catch(() => setParams(null));
  }, []);

  const warehouse = useMemo(() => {
    const lat = toNumber(params?.warehouseLat);
    const long = toNumber(params?.warehouseLong);
    return lat !== null && long !== null ? { lat, long } : null;
  }, [params]);

  const located = useMemo(() => requests.filter(hasValidCoords), [requests]);
  const unlocated = useMemo(
    () => requests.filter((r) => !hasValidCoords(r)),
    [requests]
  );
  const key = located.map((r) => r.id).join(',');

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    const fallback = (error: RoutePlan['error']) =>
      setResult({
        stops: requests.map((request) => ({ request, arrivalMinutes: null })),
        distanceKm: null,
        totalMinutes: null,
        geoJson: null,
        error,
      });

    if (requests.length === 0) {
      setResult(null);
      return;
    }
    if (!warehouse || !apiKey) {
      fallback(params ? 'noWarehouse' : null);
      return;
    }
    if (located.length === 0) {
      fallback(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
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
          computeBestOrder: located.length >= 2,
          traffic: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)) as RouteResponse;
        if (cancelled) return;

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

        setResult({
          stops: [
            ...stops,
            ...unlocated.map((request) => ({ request, arrivalMinutes: null })),
          ],
          distanceKm: route.summary.lengthInMeters / 1000,
          totalMinutes: Math.round(minutes),
          geoJson: response.toGeoJson(),
          error: null,
        });
      } catch {
        if (!cancelled) fallback('routing');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` resume `located`; `requests` muda de identidade a cada render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, warehouse, params, unlocated.length]);

  return {
    stops: result?.stops ?? requests.map((request) => ({ request, arrivalMinutes: null })),
    distanceKm: result?.distanceKm ?? null,
    totalMinutes: result?.totalMinutes ?? null,
    geoJson: result?.geoJson ?? null,
    warehouse,
    isLoading,
    error: result?.error ?? null,
  };
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
