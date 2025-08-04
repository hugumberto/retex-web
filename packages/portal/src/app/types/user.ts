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
