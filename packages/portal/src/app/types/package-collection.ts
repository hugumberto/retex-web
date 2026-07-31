import { Entity } from "./helper";
import { CollectionRequestDTO } from "./collection-request";
import { UserDTO } from "./user";

    export interface PackageCollectionFormData {
    id?: string;
    driverId: string;
    startDate: Date;
    collectionRequestIds: string[];
    status: CollectionStatus;
    collectionInterval: CollectionInterval;
  }

 export interface PackageCollectionDTO extends Entity {
  status: CollectionStatus
  friendlyCode?: string
  collectionInterval?: CollectionInterval
  driver: UserDTO
  collectionRequests: CollectionRequestDTO[]
  startDate: Date
  endDate?: Date
}

export enum CollectionInterval {
  MORNING = '09:00 - 13:00',
  AFTERNOON = '13:00 - 17:00',
  EVENING = '17:00 - 21:00',
}
 export interface PackageCollectionTableDTO extends Exclude<PackageCollectionDTO, 'collectionRequests'> {
  collectionRequestsCount: number
  confirmedCount: number
}

export enum CollectionStatus {
  DRAFTING = 'DRAFTING',
  CREATED = 'CREATED',
  WAITING_TO_START = 'WAITING_TO_START',
  IN_TRANSIT = 'IN_TRANSIT',
  FINISHED = 'FINISHED',
}

