import { Entity } from './helper';

export interface DeviceSessionDTO extends Entity {
  userId: string;
  deviceId: string;
  deviceLabel: string;
  active: boolean;
}

export interface CreateDeviceSessionData {
  deviceId: string;
  deviceLabel: string;
}
