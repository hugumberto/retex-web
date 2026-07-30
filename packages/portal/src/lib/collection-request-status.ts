import { CollectionRequestStatus } from '@/app/types/collection-request';

// As etiquetas de texto vivem no i18n (`enums.collectionRequestStatus.*`);
// aqui ficam apenas as cores, que não dependem do idioma.
export const STATUS_CLASS: Record<CollectionRequestStatus, string> = {
  [CollectionRequestStatus.CREATED]: 'bg-blue-100 text-blue-700',
  [CollectionRequestStatus.CONFIRMED]: 'bg-green-100 text-green-700',
  [CollectionRequestStatus.OUT_OF_ZONE]: 'bg-amber-100 text-amber-700',
  [CollectionRequestStatus.WAITING_FOR_COLLECTION]: 'bg-yellow-100 text-yellow-700',
  [CollectionRequestStatus.COLLECTED]: 'bg-teal-100 text-teal-700',
  [CollectionRequestStatus.IN_TRANSIT]: 'bg-purple-100 text-purple-700',
  [CollectionRequestStatus.IN_HOUSE]: 'bg-indigo-100 text-indigo-700',
  [CollectionRequestStatus.CANCELLED]: 'bg-red-100 text-red-600',
  [CollectionRequestStatus.SCREENING]: 'bg-cyan-100 text-cyan-700',
  [CollectionRequestStatus.STOCKED]: 'bg-emerald-100 text-emerald-700',
};

/** Cor (hex) por status, para usar em gráficos (recharts). */
export const STATUS_COLOR: Record<CollectionRequestStatus, string> = {
  [CollectionRequestStatus.CREATED]: '#3b82f6',
  [CollectionRequestStatus.CONFIRMED]: '#22c55e',
  [CollectionRequestStatus.OUT_OF_ZONE]: '#f59e0b',
  [CollectionRequestStatus.WAITING_FOR_COLLECTION]: '#eab308',
  [CollectionRequestStatus.COLLECTED]: '#14b8a6',
  [CollectionRequestStatus.IN_TRANSIT]: '#a855f7',
  [CollectionRequestStatus.IN_HOUSE]: '#6366f1',
  [CollectionRequestStatus.CANCELLED]: '#dc2626',
  [CollectionRequestStatus.SCREENING]: '#06b6d4',
  [CollectionRequestStatus.STOCKED]: '#10b981',
};
