import { CollectionRequestDTO } from './collection-request';

export interface QrCodeDTO {
  id: string;
  token: string;
  friendlyCode: string;
  batchId: string;
  collectionRequestId?: string | null;
  routeId?: string | null;
  usedAt?: string | null;
  weight?: number | null;
  processedAt?: string | null;
}

export interface CollectionResponse {
  collectionRequest: CollectionRequestDTO;
  qrCodes: QrCodeDTO[];
}

export interface TriageResponse {
  collectionRequest: CollectionRequestDTO;
  qrCodes: QrCodeDTO[];
}
