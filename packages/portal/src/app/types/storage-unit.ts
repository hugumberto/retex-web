export interface StorageUnitData {
  id?: string;
  brandId: string;
  quality: Quality;
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
  brand: Brand;
}
interface Brand {
  id: string;
  name: string;
  manual: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}
