export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  documentNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  roles: RoleResponse[];
}

export interface RoleResponse {
  id: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
