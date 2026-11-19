import { Entity } from './helper';

export interface VehicleDTO extends Entity {
  plate: string;
  name: string;
  capacityBags: number;
  active: boolean;
}
