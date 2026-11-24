import { Entity } from './helper';

export enum FaqStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface FaqItemDTO extends Entity {
  categoryId: string;
  title: string;
  description: string;
  // Escondida = não aparece no site.
  visible: boolean;
  position: number;
}

export interface FaqCategoryDTO extends Entity {
  title: string;
  description: string;
  status: FaqStatus;
  position: number;
  items: FaqItemDTO[];
}
