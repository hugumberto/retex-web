import { Entity } from './helper';

export interface UserDTO extends Entity {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  documentNumber: string;
  status: UserStatus;
  roles: RoleResponse[];
}

export interface RoleResponse extends Entity {
  role: Role;
}

export enum Role {
  USER = 'USER',
  DRIVER = 'DRIVER',
  OPS = 'OPS',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
