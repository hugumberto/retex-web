import { Season, StorageGroup, Type } from './triage';

export { AgeGroup, Season, Sex, StorageGroup, Type } from './triage';

export enum Status {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export type StorageUnitDTO = {
  id: string;
  friendlyCode?: string;
  group: StorageGroup;
  // Nulos apenas no lote NON_REUSABLE.
  type?: Type | null;
  season?: Season | null;
  // Localização física (armazém / posição).
  location?: string | null;
  status: Status;
  weight: number;
  itemsCount?: number;
};

export type StorageUnitFormData = {
  group: StorageGroup;
  type: Type | '';
  season: Season | '';
  location: string;
  state: Status;
  weight: number;
};
