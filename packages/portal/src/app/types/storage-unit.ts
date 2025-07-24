export enum Quality {
  GOOD = 'BOM',
  MEDIUM = 'REGULAR',
  BAD = 'RUIM',
}

export type StorageUnitDTO = {
  id: string;
  brand: {
    id: string;
    name: string;
  };
  quality: Quality;
  status: 'ATIVO' | 'INATIVO';
};

export type StorageUnitFormData = {
  brandId: string;
  quality: Quality;
  state: 'ATIVO' | 'INATIVO';
  weight: 'LEVE' | 'MEDIO' | 'PESADO';
};
