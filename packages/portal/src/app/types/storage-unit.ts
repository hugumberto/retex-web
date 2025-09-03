import { Brand } from './brand';
import { Entity } from './helper';

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
export interface StorageUnitDTO extends Entity {  
  quality: Quality;
  weight: number;
  brand: Brand;
}
