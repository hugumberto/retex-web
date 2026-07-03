import { PackageDTO } from './package';

export interface QrCodeDTO {
  id: string;
  token: string;
  friendlyCode: string;
  batchId: string;
  packageId?: string | null;
  usedAt?: string | null;
}

export interface CollectionResponse {
  package: PackageDTO;
  qrCodes: QrCodeDTO[];
}
