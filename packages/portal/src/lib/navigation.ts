import { CompanyPermission } from '@/app/types/company';
import { Role } from '@/app/types/user';
import { CompanyRule } from '@/lib/access-control';

/**
 * Navegação do portal (Figma "RETEX Backoffice"): secções com rótulo em DM Mono
 * e itens simples, sem ícones nem grupos que abrem e fecham.
 *
 * As quatro secções do design (Check-in, Check-out, Conteúdos, Contas) são as do
 * ADMIN. O que o design não tem — a empresa do cliente e as definições de
 * administração — vai para duas secções próprias no fim.
 */
export type NavItem = {
  href: string;
  /** Chave de tradução no namespace `nav`. */
  labelKey: string;
  roles: Role[];
} & CompanyRule;

export type NavSection = {
  /** Chave de tradução no namespace `nav.sections`; sem ela não há rótulo. */
  labelKey?: string;
  items: NavItem[];
};

const ALL: Role[] = [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER];

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/portal', labelKey: 'home', roles: ALL },
      {
        href: '/portal/dashboard',
        labelKey: 'dashboard',
        roles: [Role.ADMIN, Role.USER],
      },
    ],
  },
  {
    labelKey: 'checkIn',
    items: [
      {
        href: '/portal/collection-request',
        labelKey: 'collectionRequest',
        roles: [Role.ADMIN, Role.OPS, Role.USER],
      },
      {
        href: '/portal/package-collection',
        labelKey: 'managePickup',
        roles: [Role.ADMIN, Role.OPS, Role.DRIVER],
      },
      {
        href: '/portal/coleta',
        labelKey: 'pickup',
        roles: [Role.ADMIN, Role.DRIVER],
      },
    ],
  },
  {
    labelKey: 'checkOut',
    items: [
      {
        href: '/portal/storage-unit',
        labelKey: 'storage',
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/triage',
        labelKey: 'triage',
        roles: [Role.ADMIN, Role.OPS],
      },
    ],
  },
  {
    labelKey: 'contents',
    items: [
      { href: '/portal/blog', labelKey: 'blog', roles: [Role.ADMIN, Role.OPS] },
      { href: '/portal/faq', labelKey: 'faq', roles: [Role.ADMIN, Role.OPS] },
      { href: '/portal/brand', labelKey: 'brand', roles: [Role.ADMIN, Role.OPS] },
      { href: '/portal/email-log', labelKey: 'emailLog', roles: [Role.ADMIN] },
    ],
  },
  {
    labelKey: 'accounts',
    items: [
      { href: '/portal/user', labelKey: 'users', roles: [Role.ADMIN] },
      { href: '/portal/company', labelKey: 'companies', roles: [Role.ADMIN] },
    ],
  },
  {
    labelKey: 'myCompany',
    items: [
      {
        href: '/portal/my-company',
        labelKey: 'myCompanyOverview',
        roles: [Role.ADMIN, Role.OPS, Role.USER],
        requiresCompany: true,
      },
      {
        href: '/portal/my-company/members',
        labelKey: 'myCompanyMembers',
        roles: [Role.ADMIN, Role.OPS, Role.USER],
        companyPermission: CompanyPermission.MEMBER_MANAGE,
      },
      {
        href: '/portal/my-company/addresses',
        labelKey: 'myCompanyAddresses',
        roles: [Role.ADMIN, Role.OPS, Role.USER],
        requiresCompany: true,
      },
    ],
  },
  {
    labelKey: 'settings',
    items: [
      { href: '/portal/perfil', labelKey: 'account', roles: ALL },
      { href: '/portal/zona', labelKey: 'zones', roles: [Role.ADMIN] },
      { href: '/portal/parametros', labelKey: 'parameters', roles: [Role.ADMIN] },
      {
        href: '/portal/reset-password',
        labelKey: 'resetPassword',
        roles: [Role.ADMIN],
      },
      { href: '/portal/vehicles', labelKey: 'vehicles', roles: [Role.ADMIN] },
      { href: '/portal/bags', labelKey: 'packageBags', roles: [Role.ADMIN] },
      {
        href: '/portal/gestao-recolha',
        labelKey: 'collectionManagement',
        roles: [Role.MASTER],
      },
    ],
  },
];

export const isPathActive = (pathname: string | null, href: string): boolean => {
  if (href === '/portal') return pathname === '/portal';
  return (
    !!pathname &&
    pathname.startsWith(href) &&
    (pathname.length === href.length || pathname.charAt(href.length) === '/')
  );
};

/** Item e secção da página atual (o mais específico, se houver vários). */
export function findActiveNav(pathname: string | null) {
  let best: { section: NavSection; item: NavItem } | null = null;
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (
        isPathActive(pathname, item.href) &&
        (!best || item.href.length > best.item.href.length)
      ) {
        best = { section, item };
      }
    }
  }
  return best;
}

// Ordem de precedência para a etiqueta ao lado do logótipo.
const ROLE_PRECEDENCE: Role[] = [
  Role.MASTER,
  Role.ADMIN,
  Role.OPS,
  Role.DRIVER,
  Role.USER,
];

export const primaryRole = (roles: Role[]): Role | null =>
  ROLE_PRECEDENCE.find((role) => roles.includes(role)) ?? null;
