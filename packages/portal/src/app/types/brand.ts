import { Entity } from './helper';

export interface Brand extends Entity {
  name: string;
  manual: boolean;
}

export interface BrandFormData {
  name: string;
  manual: boolean;
}
