import { clsx, type ClassValue } from 'clsx';
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Boxes,
  Tag,
  Tags,
  UserIcon,
  RefreshCw,
  HandHelping,
  CircleUser,
  MapPin,
  HelpCircle,
  NewspaperIcon,
  Globe,
  Settings,
  PackageCheck,
  Truck,
  SlidersHorizontal,
  Mail,
  KeyRound,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Role } from '@/app/types/user';

export type NavLeaf = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

export type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  children: NavLeaf[];
};

export type NavEntry = NavLeaf | NavGroup;

/** Backwards-compatible alias. */
export type NavItem = NavLeaf;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return (entry as NavGroup).children !== undefined;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const NAV_ITEMS: NavEntry[] = [
  {
    href: '/portal',
    label: 'INÍCIO',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
  },
  {
    href: '/portal/dashboard',
    label: 'DASHBOARD',
    icon: BarChart3,
    roles: [Role.ADMIN],
  },
  {
    href: '/portal/triage',
    label: 'TRIAGEM',
    icon: RefreshCw,
    roles: [Role.ADMIN, Role.OPS],
  },
  {
    href: '/portal/collection-request',
    label: 'SOLICITAR RECOLHA',
    icon: HandHelping,
    roles: [Role.ADMIN, Role.OPS, Role.USER],
  },
  {
    label: 'LOGÍSTICA',
    icon: Truck,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER],
    children: [
      {
        href: '/portal/package-collection',
        label: 'GERIR RECOLHA',
        icon: ClipboardList,
        roles: [Role.ADMIN, Role.OPS, Role.DRIVER],
      },
      {
        href: '/portal/storage-unit',
        label: 'ARMAZENAMENTO',
        icon: Boxes,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/coleta',
        label: 'RECOLHA',
        icon: PackageCheck,
        roles: [Role.ADMIN, Role.DRIVER],
      },
    ],
  },
  {
    label: 'LANDING PAGE',
    icon: Globe,
    roles: [Role.ADMIN, Role.OPS],
    children: [
      {
        href: '/portal/blog',
        label: 'Blog',
        icon: NewspaperIcon,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/blog-categories',
        label: 'Categorias',
        icon: Tags,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/faq',
        label: 'FAQ',
        icon: HelpCircle,
        roles: [Role.ADMIN, Role.OPS],
      },
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    icon: Settings,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
    children: [
      {
        href: '/portal/perfil',
        label: 'Conta',
        icon: CircleUser,
        roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
      },
      {
        href: '/portal/brand',
        label: 'MARCA',
        icon: Tag,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/user',
        label: 'Utilizadores',
        icon: UserIcon,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/zona',
        label: 'Zonas',
        icon: MapPin,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/parametros',
        label: 'Parâmetros',
        icon: SlidersHorizontal,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/email-log',
        label: 'Registo de Emails',
        icon: Mail,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/reset-password',
        label: 'Repor Senha',
        icon: KeyRound,
        roles: [Role.ADMIN],
      },
    ],
  },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
