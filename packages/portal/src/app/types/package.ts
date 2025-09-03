import { Brand } from "./brand";
import { Entity } from "./helper"
import { PackageCollectionDTO } from "./package-collection"
import { StorageUnitDTO } from "./storage-unit";
import { User } from "./user"

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

export interface PackageDTO extends Entity {
  status: PackageStatus
  user: User
  route?: PackageCollectionDTO
  weight?: number
  collectDay: string
  collectTime: string
  address: Address
  items?: PackageItemDTO[]
}
export interface PackageItemDTO extends Entity {
  package: PackageDTO
  quality: Quality
  type: Type
  storageUnit: StorageUnitDTO
  season: Season
  brand: Brand
  quantity: number
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

export enum PackageStatus {
  CREATED = 'CREATED',
  OUT_OF_ZONE = 'OUT_OF_ZONE',
  WAITING_FOR_COLLECTION = 'WAITING_FOR_COLLECTION',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_HOUSE = 'IN_HOUSE',
  CANCELLED = 'CANCELLED',
  SCREENING = 'SCREENING',
  STOCKED = 'STOCKED',
}
