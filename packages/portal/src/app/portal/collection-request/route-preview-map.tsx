'use client';

import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import type { FeatureCollection } from 'geojson';
import { useEffect, useRef } from 'react';

export type MapPoint = { label: string; lat: number; long: number };

// Centro padrão (Maia) só até ao primeiro fitBounds.
const DEFAULT_CENTER: [number, number] = [-8.62, 41.23];

const markerElement = (label: string, isWarehouse: boolean) => {
  const el = document.createElement('div');
  el.textContent = label;
  el.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'width:22px',
    'height:22px',
    'border-radius:999px',
    'font:600 10px/1 var(--font-poppins), sans-serif',
    'color:#fff',
    'border:2px solid #fff',
    'box-shadow:0 1px 3px rgba(1,51,100,.35)',
    `background:${isWarehouse ? '#013364' : '#02748e'}`,
  ].join(';');
  return el;
};

/** Mapa do painel "Nova rota": armazém (A), paragens numeradas e percurso. */
export default function RoutePreviewMap({
  points,
  route,
}: {
  points: MapPoint[];
  route: FeatureCollection | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<tt.Map | null>(null);
  const markersRef = useRef<tt.Marker[]>([]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!containerRef.current || !key) return;
    const map = tt.map({
      key,
      container: containerRef.current,
      center: DEFAULT_CENTER,
      zoom: 10,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (points.length === 0) return;

    const bounds = new tt.LngLatBounds();
    points.forEach((point) => {
      const marker = new tt.Marker({
        element: markerElement(point.label, point.label === 'A'),
      })
        .setLngLat([point.long, point.lat])
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([point.long, point.lat]);
    });
    map.fitBounds(bounds, { padding: 30, maxZoom: 14, duration: 0 });
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (map.getLayer('route-preview')) map.removeLayer('route-preview');
      if (map.getSource('route-preview')) map.removeSource('route-preview');
      if (!route) return;
      map.addSource('route-preview', { type: 'geojson', data: route });
      map.addLayer({
        id: 'route-preview',
        type: 'line',
        source: 'route-preview',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#02748e',
          'line-width': 3,
          'line-dasharray': [2, 1.5],
        },
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [route]);

  return (
    <div
      ref={containerRef}
      className="h-[190px] w-full overflow-hidden rounded-[10px] bg-row-selected"
    />
  );
}
