export enum Quality {
  GOOD = 'GOOD',
  MEDIUM = 'MEDIUM',
  BAD = 'BAD',
}

export type StorageUnitDTO = {
  id: string;
  brand: {
    id: string;
    name: string;
  };
  quality: Quality;
  status: 'ATIVO' | 'INATIVO';
  weight: number; 
};

export type StorageUnitFormData = {
  brandId: string;
  quality: Quality;
  state: 'ATIVO' | 'INATIVO';
  weight: number; 
};
