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
  /** Zona do armazém; nula = a do grupo (não reutilizável → reciclagem). */
  zone?: 'REUSE' | 'UPCYCLING' | 'RECYCLING' | null;
  /** Saída programada que leva o lote. */
  outboundId?: string | null;
};

export type StorageUnitFormData = {
  group: StorageGroup;
  type: Type | '';
  season: Season | '';
  location: string;
  state: Status;
  weight: number;
  /** 'AUTO' = a zona do grupo. */
  zone: 'AUTO' | 'REUSE' | 'UPCYCLING' | 'RECYCLING';
};
