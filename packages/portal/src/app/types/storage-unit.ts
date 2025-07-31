import { BrandResponse } from './brand';

export interface StorageUnitData {
  id?: string;
  brandId: string;
  quality: Quality;
  weight: number;
}
export enum Quality {
  GOOD = 'GOOD',
  MEDIUM = 'MEDIUM',
  BAD = 'BAD',
}
export interface StorageUnitResponse {
  id: string;
  quality: Quality;
  weight: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
  brand: BrandResponse;
}
