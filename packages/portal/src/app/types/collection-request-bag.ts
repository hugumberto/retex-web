import { CollectionRequestDTO } from './collection-request';

export interface CollectionRequestBagDTO {
  id: string;
  token: string;
  friendlyCode: string;
  batchId: string;
  collectionRequestId?: string | null;
  routeId?: string | null;
  usedAt?: string | null;
  /** Receção no armazém: hora e peso bruto lido à chegada. */
  receivedAt?: string | null;
  receivedWeight?: number | string | null;
  weight?: number | null;
  processedAt?: string | null;
}

export interface CollectionResponse {
  collectionRequest: CollectionRequestDTO;
  bags: CollectionRequestBagDTO[];
}

export interface TriageResponse {
  collectionRequest: CollectionRequestDTO;
  bags: CollectionRequestBagDTO[];
}
