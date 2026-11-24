import { CollectionRequestStatus } from '@/app/types/collection-request';

// As etiquetas de texto vivem no i18n (`enums.collectionRequestStatus.*`);
// aqui ficam apenas as cores, que não dependem do idioma.
export const STATUS_CLASS: Record<CollectionRequestStatus, string> = {
  [CollectionRequestStatus.CREATED]: 'bg-neutral-badge text-ink',
  [CollectionRequestStatus.CONFIRMED]: 'bg-sky text-navy',
  [CollectionRequestStatus.OUT_OF_ZONE]: 'bg-[#fdf1dc] text-[#8a5a12]',
  [CollectionRequestStatus.WAITING_FOR_COLLECTION]: 'bg-sky text-navy',
  [CollectionRequestStatus.COLLECTED]: 'bg-[#dceff3] text-teal',
  [CollectionRequestStatus.IN_TRANSIT]: 'bg-[#dceff3] text-teal',
  [CollectionRequestStatus.IN_HOUSE]: 'bg-[#dceff3] text-teal',
  [CollectionRequestStatus.CANCELLED]: 'bg-[#fbecea] text-[#a12a1e]',
  [CollectionRequestStatus.SCREENING]: 'bg-[#dceff3] text-teal',
  [CollectionRequestStatus.STOCKED]: 'bg-mint text-forest',
};

/** Cor (hex) por status, para usar em gráficos (recharts). */
export const STATUS_COLOR: Record<CollectionRequestStatus, string> = {
  [CollectionRequestStatus.CREATED]: '#8fb0c4',
  [CollectionRequestStatus.CONFIRMED]: '#013364',
  [CollectionRequestStatus.OUT_OF_ZONE]: '#d99a2b',
  [CollectionRequestStatus.WAITING_FOR_COLLECTION]: '#4f7fa3',
  [CollectionRequestStatus.COLLECTED]: '#02748e',
  [CollectionRequestStatus.IN_TRANSIT]: '#5fa3b3',
  [CollectionRequestStatus.IN_HOUSE]: '#2b8a9e',
  [CollectionRequestStatus.CANCELLED]: '#a12a1e',
  [CollectionRequestStatus.SCREENING]: '#7fb8c4',
  [CollectionRequestStatus.STOCKED]: '#2d5a4e',
};
