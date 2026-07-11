import { PackageDTO } from './package';

export interface QrCodeDTO {
  id: string;
  token: string;
  friendlyCode: string;
  batchId: string;
  packageId?: string | null;
  routeId?: string | null;
  usedAt?: string | null;
  weight?: number | null;
  processedAt?: string | null;
}

export interface CollectionResponse {
  package: PackageDTO;
  qrCodes: QrCodeDTO[];
}

export interface TriageResponse {
  package: PackageDTO;
  qrCodes: QrCodeDTO[];
}
