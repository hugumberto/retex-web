import { Entity } from './helper';
import { UserDTO } from './user';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CompanyMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CompanyPermission {
  REQUEST_CREATE = 'REQUEST_CREATE',
  REQUEST_VIEW_OWN = 'REQUEST_VIEW_OWN',
  REQUEST_VIEW_ALL = 'REQUEST_VIEW_ALL',
  REQUEST_CANCEL_OWN = 'REQUEST_CANCEL_OWN',
  REQUEST_CANCEL_ALL = 'REQUEST_CANCEL_ALL',
  MEMBER_MANAGE = 'MEMBER_MANAGE',
  ADDRESS_MANAGE = 'ADDRESS_MANAGE',
}

export interface CompanyDTO extends Entity {
  name: string;
  legalName?: string | null;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  status: CompanyStatus;
  friendlyCode?: string | null;
}

export interface CompanyProfileDTO extends Entity {
  companyId?: string | null;
  key: string;
  name: string;
  permissions: CompanyPermission[];
}

export interface CompanyMemberDTO extends Entity {
  userId: string;
  companyId: string;
  profileId: string;
  status: CompanyMemberStatus;
  user?: UserDTO;
  profile?: CompanyProfileDTO;
}

/** Resposta de GET /company/me — null quando o utilizador não é de empresa. */
export interface CompanyContextDTO {
  company: CompanyDTO;
  profile: CompanyProfileDTO;
  permissions: CompanyPermission[];
}

export interface CompanyFormData {
  id?: string;
  name: string;
  legalName?: string;
  taxId: string;
  email?: string;
  phone?: string;
  status?: CompanyStatus;
  manager?: {
    firstName: string;
    lastName: string;
    email: string;
    contactPhone?: string;
  };
}
