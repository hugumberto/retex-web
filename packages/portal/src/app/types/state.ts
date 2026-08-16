import { CompanyContextDTO } from './company';
import { UserDTO } from './user';

export interface AuthSlice {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDTO | null;
  setAccessToken: (t: string | null) => void;
  setRefreshToken: (t: string | null) => void;
  setUser: (u: UserDTO | null) => void;
  logout: () => Promise<void>;
}

export interface CompanySlice {
  /** Contexto devolvido por GET /company/me; `null` se não for de empresa. */
  companyContext: CompanyContextDTO | null;
  /** `false` até a primeira resposta de GET /company/me (ou até se saber que não há sessão). */
  companyContextLoaded: boolean;
  setCompanyContext: (context: CompanyContextDTO | null) => void;
  clearCompanyContext: () => void;
}

export interface UiSlice {
  pageTitle: string;
  isDarkMode: boolean;
  setPageTitle: (title: string) => void;
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
  setTheme: (isDarkMode: boolean) => void;
}

export type State<T> = Partial<T> | T | ((state: T) => Partial<T> | T);
export type SetState<T> = (
  partial: State<T>,
  replace?: boolean,
  name?: string
) => void;
export interface AppStore extends UiSlice, AuthSlice, CompanySlice {}
