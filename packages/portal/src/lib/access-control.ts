import { Role, UserDTO } from '@/app/types/user';

export type RoutePermission = {
  path: string;
  roles: Role[];
};

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/portal', roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER] },
  { path: '/portal/collection-request', roles: [Role.ADMIN, Role.OPS, Role.USER] },
  { path: '/portal/triage', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/package-collection', roles: [Role.ADMIN, Role.OPS, Role.DRIVER] },
  { path: '/portal/storage-unit', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/brand', roles: [Role.ADMIN, Role.OPS] },
  { path: '/portal/user', roles: [Role.ADMIN] },
  { path: '/portal/zona', roles: [Role.ADMIN] },
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

export const getUserRoles = (user: UserDTO | null): Role[] => {
  return user?.roles?.map((role) => role.role) ?? [];
};

export const canAccessPath = (pathname: string, user: UserDTO | null): boolean => {
  const permission = ROUTE_PERMISSIONS.find((route) => matchesRoute(pathname, route.path));

  if (!permission) {
    return true;
  }

  const userRoles = getUserRoles(user);
  return permission.roles.some((role) => userRoles.includes(role));
};

export const getFirstAllowedPortalPath = (user: UserDTO | null): string => {
  const userRoles = getUserRoles(user);

  const allowedRoute = ROUTE_PERMISSIONS.find((route) =>
    route.roles.some((role) => userRoles.includes(role))
  );

  return allowedRoute?.path ?? '/auth/login';
};
