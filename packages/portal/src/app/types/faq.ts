import { Entity } from './helper';

export enum FaqStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface FaqItemDTO extends Entity {
  categoryId: string;
  title: string;
  description: string;
}

export interface FaqCategoryDTO extends Entity {
  title: string;
  description: string;
  status: FaqStatus;
  items: FaqItemDTO[];
}
