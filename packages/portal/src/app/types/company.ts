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

/**
 * Morada de recolha partilhada por uma empresa.
 *
 * Vive na mesma tabela das moradas pessoais (`user_address`), mas com
 * `companyId` preenchido e `userId` a null — a base de dados garante que só um
 * dos dois existe. Não se reutiliza o `AddressDTO` de `user.ts` porque lá o
 * `userId` é obrigatório.
 */
export interface CompanyAddressDTO extends Entity {
  companyId: string | null;
  userId: string | null;
  street: string;
  number: string;
  complement?: string | null;
  city: string;
  cityNormalized?: string | null;
  cityDivision?: string | null;
  country?: string | null;
  countryDivision?: string | null;
  zipCode: string;
  lat?: string | null;
  long?: string | null;
  isDefault: boolean;
  isInServiceZone: boolean;
}

export interface CompanyAddressFormData {
  street: string;
  number: string;
  complement?: string;
  city: string;
  zipCode: string;
  countryDivision?: string;
  country?: string;
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
