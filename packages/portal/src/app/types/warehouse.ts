import { CollectionRequestStatus } from './collection-request';
import { StorageUnitDTO } from './storage-unit';

/** Zona do armazém onde fica um lote; nula = a do grupo. */
export enum StorageZone {
  REUSE = 'REUSE',
  UPCYCLING = 'UPCYCLING',
  RECYCLING = 'RECYCLING',
}

/** A (por triar) + as zonas dos lotes. */
export type WarehouseZoneKey = 'SORTING' | StorageZone;

export const ZONE_LETTER: Record<WarehouseZoneKey, string> = {
  SORTING: 'A',
  REUSE: 'B',
  UPCYCLING: 'C',
  RECYCLING: 'D',
};

export enum OutboundType {
  RECYCLING = 'RECYCLING',
  DONATION = 'DONATION',
  UPCYCLING = 'UPCYCLING',
  SALE = 'SALE',
}

export enum OutboundStatus {
  SCHEDULED = 'SCHEDULED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

/** Zona de onde cada tipo de saída leva os lotes. */
export const OUTBOUND_ZONE: Record<OutboundType, StorageZone> = {
  RECYCLING: StorageZone.RECYCLING,
  UPCYCLING: StorageZone.UPCYCLING,
  DONATION: StorageZone.REUSE,
  SALE: StorageZone.REUSE,
};

export type WarehouseZoneSummary = {
  zone: WarehouseZoneKey;
  capacityKg: number;
  weightKg: number;
  /** Parte do peso estimada a partir das peças. */
  estimated: boolean;
  bags?: number;
  pieces?: number;
};

export type ReceptionRow = {
  collectionRequestId: string;
  code: string | null;
  city: string | null;
  routeCode: string | null;
  receivedAt: string;
  bagsLinked: number;
  bagsReceived: number;
  weight: number;
  status: CollectionRequestStatus;
};

export type WarehouseOutboundDTO = {
  id: string;
  type: OutboundType;
  destination: string;
  scheduledDate: string;
  weight?: number | string | null;
  pieces?: number | null;
  notes?: string | null;
  status: OutboundStatus;
  storageUnits?: Pick<StorageUnitDTO, 'id' | 'friendlyCode' | 'group' | 'weight' | 'itemsCount'>[];
};

export type WarehouseOverview = {
  date: string;
  zones: WarehouseZoneSummary[];
  totalWeightKg: number;
  totalCapacityKg: number;
  receptions: ReceptionRow[];
  outbounds: WarehouseOutboundDTO[];
};

export type ReceiveResult = {
  collectionRequestId: string;
  code: string | null;
  bagsReceivedNow: number;
  bagsReceived: number;
  bagsLinked: number;
  status: CollectionRequestStatus;
};
