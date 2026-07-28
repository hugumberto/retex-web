import { Brand } from "./brand";
import { Entity } from "./helper"
import { PackageCollectionDTO } from "./package-collection"
import { StorageUnitDTO } from "./storage-unit";
import { UserDTO } from "./user"

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
  route?: PackageCollectionDTO
  weight?: number
  estimatedBags?: number
  address: Address
  items?: CollectionRequestItemDTO[]
}
export interface CollectionRequestItemDTO extends Entity {
  collectionRequest: CollectionRequestDTO
  quality: Quality
  type: Type
  storageUnit: StorageUnitDTO
  season: Season
  sex: Sex
  ageGroup: AgeGroup
  brand: Brand
  quantity: number
  bag?: { id: string; friendlyCode?: string } | null
}

export enum Quality {
  GOOD = "GOOD",
  MEDIUM = "MEDIUM",
  BAD = "BAD",
}

export enum Type {
  UPPER_PART = "UPPER_PART",
  UNDER_PART = "UNDER_PART",
}

export enum Season {
  SUMMER = "SUMMER",
  WINTER = "WINTER",
}

export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum AgeGroup {
  ADULT = "ADULT",
  CHILD = "CHILD",
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
