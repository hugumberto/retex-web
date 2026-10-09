import { Brand } from "./brand";
import { CompanyDTO } from "./company";
import { Entity } from "./helper"
import { PackageCollectionDTO } from "./package-collection"
import { StorageUnitDTO } from "./storage-unit";
import { UserDTO } from "./user"
import {
  AgeGroup,
  Category,
  Condition,
  Destination,
  Season,
  Sex,
  Type,
} from "./triage";

export { AgeGroup, Season, Sex, Type } from "./triage";

export interface Address {
  street: string;
  number: string;
  complement?: string;
  city: string;
  cityDivision: string;
  country: string;
  countryDivision: string;
  zipCode: string;
  lat: number;
  long: number;
} 

export interface CollectionRequestDTO extends Entity {
  status: CollectionRequestStatus
  friendlyCode?: string
  user: UserDTO
  // Preenchido quando a solicitação é de uma empresa; null para particulares.
  // É o que distingue os dois na listagem e na construção de rotas.
  companyId?: string | null
  company?: CompanyDTO | null
  route?: PackageCollectionDTO
  weight?: number
  estimatedBags?: number
  address: Address
  items?: CollectionRequestItemDTO[]
}
export interface CollectionRequestItemDTO extends Entity {
  collectionRequest: CollectionRequestDTO
  storageUnit: StorageUnitDTO
  quantity: number
  bag?: { id: string; friendlyCode?: string } | null
  // Indicadores básicos (decidem o lote).
  destination: Destination
  sex?: Sex | null
  ageGroup?: AgeGroup | null
  season?: Season | null
  type?: Type | null
  // Indicadores informativos.
  category?: Category | null
  condition?: Condition | null
  brand?: Brand | null
  denim?: boolean | null
  material?: string | null
  color?: string | null
  size?: string | null
}

export enum CollectionRequestStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  OUT_OF_ZONE = 'OUT_OF_ZONE',
  WAITING_FOR_COLLECTION = 'WAITING_FOR_COLLECTION',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_HOUSE = 'IN_HOUSE',
  CANCELLED = 'CANCELLED',
  SCREENING = 'SCREENING',
  STOCKED = 'STOCKED',
}
