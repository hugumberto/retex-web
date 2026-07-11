import { PackageDTO } from '@/app/types/package';

export interface LatLong {
  lat: number;
  long: number;
}

// Colunas decimais chegam da API como string — sempre coagir para número.
export const readCoords = (pkg: PackageDTO): LatLong => ({
  lat: Number(pkg.address?.lat),
  long: Number(pkg.address?.long),
});

export const hasValidCoords = (pkg: PackageDTO): boolean => {
  const { lat, long } = readCoords(pkg);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(long) &&
    !(lat === 0 && long === 0)
  );
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Distância em quilómetros entre dois pontos (fórmula de haversine).
export const haversineKm = (a: LatLong, b: LatLong): number => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLong = toRad(b.long - a.long);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLong / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Distância mínima de um ponto ao conjunto de pontos de referência.
export const minDistanceKm = (point: LatLong, references: LatLong[]): number =>
  references.reduce(
    (min, ref) => Math.min(min, haversineKm(point, ref)),
    Number.POSITIVE_INFINITY,
  );
