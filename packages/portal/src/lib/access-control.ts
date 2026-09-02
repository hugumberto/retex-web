import { CompanyContextDTO, CompanyPermission } from '@/app/types/company';
import { Role, UserDTO } from '@/app/types/user';

/**
 * Hierarquia de perfis, espelho de `domain/user/role-hierarchy.ts` na API: quem
 * tem a chave herda os valores. Evita ter de acrescentar `Role.MASTER` a todas
 * as entradas de `ROUTE_PERMISSIONS` e do menu.
 */
const ROLE_INHERITANCE: Partial<Record<Role, Role[]>> = {
  [Role.MASTER]: [Role.ADMIN],
};

/** Perfis cuja gestão (criar, editar, repor senha) é exclusiva do MASTER. */
export const PRIVILEGED_ROLES: Role[] = [Role.ADMIN, Role.MASTER];

/**
 * Regra de empresa aplicável a uma rota ou a um item de menu.
 *
 * Existe um segundo eixo de autorização, ortogonal às `Role`: os membros de uma
 * empresa são sempre `Role.USER` a nível global, e quem decide o que podem fazer
 * dentro da empresa é o perfil (`CompanyProfile.permissions`), que chega em
 * GET /company/me. Um particular e um gestor de empresa têm exatamente a mesma
 * role — só o contexto de empresa os distingue.
 */
export type CompanyRule = {
  /** Exige ser membro ativo de uma empresa (qualquer perfil). */
  requiresCompany?: boolean;
  /** Exige, além disso, esta permissão no perfil de empresa. */
  companyPermission?: CompanyPermission;
};

export type RoutePermission = {
  path: string;
  roles: Role[];
} & CompanyRule;

/**
 * A ordem importa: `matchesRoute` faz correspondência por prefixo e
 * `canAccessPath` usa a PRIMEIRA entrada que corresponder. Rotas aninhadas têm
 * de vir antes da rota-pai, senão `/portal/my-company` capturaria
 * `/portal/my-company/members` e a permissão específica nunca seria aplicada.
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/portal', roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER] },
  // Sem regra de empresa: um particular também tem dashboard. Quem distingue
  // as audiências é o próprio ecrã, a partir do contexto de empresa.
  { path: '/portal/dashboard', roles: [Role.ADMIN, Role.USER] },
  { path: '/portal/collection-request', roles: [Role.ADMIN, Role.OPS, Role.USER] },
  { path: '/portal/triage', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/package-collection', roles: [Role.ADMIN, Role.OPS, Role.DRIVER] },
  { path: '/portal/storage-unit', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/coleta', roles: [Role.ADMIN, Role.DRIVER] },
  { path: '/portal/brand', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/user', roles: [Role.ADMIN] },
  { path: '/portal/company', roles: [Role.ADMIN] },
  // Self-service do gestor. As duas sub-rotas vêm antes da raiz de propósito.
  {
    path: '/portal/my-company/members',
    roles: [Role.ADMIN, Role.OPS, Role.USER],
    companyPermission: CompanyPermission.MEMBER_MANAGE,
  },
  {
    path: '/portal/my-company/addresses',
    roles: [Role.ADMIN, Role.OPS, Role.USER],
    requiresCompany: true,
  },
  {
    path: '/portal/my-company',
    roles: [Role.ADMIN, Role.OPS, Role.USER],
    requiresCompany: true,
  },
  { path: '/portal/zona', roles: [Role.ADMIN] },
  { path: '/portal/parametros', roles: [Role.ADMIN] },
  { path: '/portal/email-log', roles: [Role.ADMIN] },
  { path: '/portal/reset-password', roles: [Role.ADMIN] },
  { path: '/portal/bags', roles: [Role.ADMIN] },
  { path: '/portal/faq', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/blog', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/blog-categories', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/perfil', roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER] },
];

const matchesRoute = (pathname: string, routePath: string) => {
  if (routePath === '/portal') {
    return pathname === '/portal';
  }

  return (
    pathname === routePath ||
    (pathname.startsWith(routePath) && pathname.charAt(routePath.length) === '/')
  );
};

/** Perfis tal como vêm da API, sem herança. */
export const getRawUserRoles = (user: UserDTO | null): Role[] => {
  return user?.roles?.map((role) => role.role) ?? [];
};

/**
 * Perfis efetivos: os do utilizador mais os que herda. É o que interessa para
 * decidir acessos — um MASTER passa em tudo o que exige ADMIN.
 */
export const getUserRoles = (user: UserDTO | null): Role[] => {
  const expanded = new Set<Role>();
  const pending = getRawUserRoles(user);

  while (pending.length) {
    const role = pending.pop() as Role;
    if (expanded.has(role)) continue;
    expanded.add(role);
    pending.push(...(ROLE_INHERITANCE[role] ?? []));
  }

  return [...expanded];
};

/** `true` se o utilizador tem mesmo o perfil MASTER (a herança não conta). */
export const isMaster = (user: UserDTO | null): boolean =>
  getRawUserRoles(user).includes(Role.MASTER);

/** `true` se a conta é ADMIN/MASTER — só um MASTER lhe pode mexer. */
export const isPrivilegedUser = (user: UserDTO | null): boolean =>
  getRawUserRoles(user).some((role) => PRIVILEGED_ROLES.includes(role));

/** Avalia a regra de empresa de uma rota ou item de menu. Sem regra, passa. */
export const hasCompanyAccess = (
  companyContext: CompanyContextDTO | null,
  rule: CompanyRule
): boolean => {
  if (!rule.requiresCompany && !rule.companyPermission) return true;
  if (!companyContext) return false;
  if (!rule.companyPermission) return true;

  return companyContext.permissions.includes(rule.companyPermission);
};

/** `true` se a rota depende do contexto de empresa para ser decidida. */
export const routeRequiresCompany = (pathname: string): boolean => {
  const permission = ROUTE_PERMISSIONS.find((route) =>
    matchesRoute(pathname, route.path)
  );

  return Boolean(permission?.requiresCompany || permission?.companyPermission);
};

export const canAccessPath = (
  pathname: string,
  user: UserDTO | null,
  companyContext: CompanyContextDTO | null = null
): boolean => {
  const permission = ROUTE_PERMISSIONS.find((route) => matchesRoute(pathname, route.path));

  // Negar por omissão: rotas não listadas não são acessíveis (defesa em profundidade).
  if (!permission) {
    return false;
  }

  const userRoles = getUserRoles(user);
  if (!permission.roles.some((role) => userRoles.includes(role))) {
    return false;
  }

  return hasCompanyAccess(companyContext, permission);
};

export const getFirstAllowedPortalPath = (
  user: UserDTO | null,
  companyContext: CompanyContextDTO | null = null
): string => {
  const userRoles = getUserRoles(user);

  const allowedRoute = ROUTE_PERMISSIONS.find(
    (route) =>
      route.roles.some((role) => userRoles.includes(role)) &&
      // Sem isto, um particular podia ser reencaminhado para um ecrã de empresa
      // que o guard recusa logo a seguir — um ciclo de redirects.
      hasCompanyAccess(companyContext, route)
  );

  return allowedRoute?.path ?? '/auth/login';
};
