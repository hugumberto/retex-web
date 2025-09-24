export enum Quality {
  GOOD = 'GOOD',
  MEDIUM = 'MEDIUM',
  BAD = 'BAD',
}
export enum Status {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export type StorageUnitDTO = {
  id: string;
  brand: {
    id: string;
    name: string;
  };
  quality: Quality;
  status: Status;
  weight: number; 
};

export type StorageUnitFormData = {
  brandId: string;
  quality: Quality;
  state: Status;
  weight: number; 
};
