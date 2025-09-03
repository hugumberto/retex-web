import { Entity } from "./helper";

export interface User extends Entity {
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

export interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  documentNumber: string;
  password?: string;
  role?: Role[];
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
