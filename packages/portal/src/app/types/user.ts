import { Entity } from "./helper";

export interface AddressDTO {
  id: string;
  userId: string;
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
  isDefault: boolean;
  isInServiceZone: boolean;
}

export interface UserDTO extends Entity {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
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
