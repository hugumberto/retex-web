import { Entity } from "./helper";
import { PackageDTO } from "./package";
import { UserDTO } from "./user";

export enum Shift {
    MORNING = 'Manhã',
    AFTERNOON = 'Tarde',
    NIGHT = 'Noite',
  }
    export interface PackageCollectionFormData {
    id?: string;
    driverId: string; 
    startDate: Date;
    shift: Shift;
    packageIds: string[];
    status: CollectionStatus;
  }
  
  export interface CollectionItemResponse {
    id: string;
    address: string;
    dayOfWeek: string;
    shift: Shift;
  }

 export interface PackageCollectionDTO extends Entity {
  status: CollectionStatus
  driver: UserDTO
  packages: PackageDTO[]
  startDate: Date
  endDate?: Date
}
 export interface PackageCollectionTableDTO extends Exclude<PackageCollectionDTO, 'packages'> {  
  packagesCount: number
}

export enum CollectionStatus {
  DRAFTING = 'DRAFTING',
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  FINISHED = 'FINISHED',
}
