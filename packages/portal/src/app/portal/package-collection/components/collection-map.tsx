'use client';

import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import type { FeatureCollection } from 'geojson';
import { useEffect, useRef } from 'react';

import { CollectionRequestDTO } from '@/app/types/collection-request';
import { readCoords } from '../utils';

interface CollectionMapProps {
  // Apenas elegíveis com coordenada válida.
  collectionRequests: CollectionRequestDTO[];
  selectedIds: string[];
  suggestedIds?: string[];
  // Geometria da rota otimizada (FeatureCollection do TomTom services).
  routeGeoJson?: FeatureCollection | null;
  onToggle: (id: string) => void;
}

const COLORS = {
  selected: '#02748e',
  suggested: '#f59e0b',
  default: '#94a3b8',
};

// Centro padrão: Lisboa (usado só antes do primeiro fitBounds).
const DEFAULT_CENTER: [number, number] = [-9.1393, 38.7223];

export default function CollectionMap({
  collectionRequests,
  selectedIds,
  suggestedIds = [],
  routeGeoJson,
  onToggle,
}: CollectionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markersRef = useRef<tt.Marker[]>([]);
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  // Inicializa o mapa uma única vez.
  useEffect(() => {
    if (!containerRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) {
      console.error(
        'NEXT_PUBLIC_TOMTOM_API_KEY não está definida; o mapa não será inicializado.'
      );
      return;
    }
    const map = tt.map({
      key: apiKey,
      container: containerRef.current,
      center: DEFAULT_CENTER,
      zoom: 9,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redesenha marcadores quando pacotes/seleção/sugestões mudam.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const selected = new Set(selectedIds);
    const suggested = new Set(suggestedIds);
    const bounds = new tt.LngLatBounds();
    let plotted = 0;

    collectionRequests.forEach((pkg) => {
      const { lat, long } = readCoords(pkg);
      const color = selected.has(pkg.id)
        ? COLORS.selected
        : suggested.has(pkg.id)
          ? COLORS.suggested
          : COLORS.default;

      const marker = new tt.Marker({ color })
        .setLngLat([long, lat])
        .addTo(map);

      const element = marker.getElement();
      element.style.cursor = 'pointer';
      element.title = `${pkg.address?.street ?? ''} ${pkg.address?.number ?? ''}`;
      element.addEventListener('click', () => onToggleRef.current(pkg.id));

      markersRef.current.push(marker);
      bounds.extend([long, lat]);
      plotted += 1;
    });

    if (plotted > 0) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [collectionRequests, selectedIds, suggestedIds]);

  // Desenha/atualiza a polyline da rota otimizada.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyRoute = () => {
      if (map.getLayer('optimized-route')) map.removeLayer('optimized-route');
      if (map.getSource('optimized-route')) map.removeSource('optimized-route');

      if (routeGeoJson) {
        map.addSource('optimized-route', { type: 'geojson', data: routeGeoJson });
        map.addLayer({
          id: 'optimized-route',
          type: 'line',
          source: 'optimized-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': COLORS.selected, 'line-width': 5 },
        });
      }
    };

    if (map.isStyleLoaded()) {
      applyRoute();
    } else {
      map.once('load', applyRoute);
    }
  }, [routeGeoJson]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-lg border border-secondary/25"
    />
  );
}
