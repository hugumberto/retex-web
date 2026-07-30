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
  Package,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Role } from '@/app/types/user';

export type NavLeaf = {
  href: string;
  /** Chave de tradução no namespace `nav`. */
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

export type NavGroup = {
  /** Chave de tradução no namespace `nav`. */
  labelKey: string;
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
    labelKey: 'nav.home',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
  },
  {
    href: '/portal/dashboard',
    labelKey: 'nav.dashboard',
    icon: BarChart3,
    roles: [Role.ADMIN],
  },
  {
    href: '/portal/triage',
    labelKey: 'nav.triage',
    icon: RefreshCw,
    roles: [Role.ADMIN, Role.OPS],
  },
  {
    href: '/portal/collection-request',
    labelKey: 'nav.collectionRequest',
    icon: HandHelping,
    roles: [Role.ADMIN, Role.OPS, Role.USER],
  },
  {
    labelKey: 'nav.logistics',
    icon: Truck,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER],
    children: [
      {
        href: '/portal/package-collection',
        labelKey: 'nav.managePickup',
        icon: ClipboardList,
        roles: [Role.ADMIN, Role.OPS, Role.DRIVER],
      },
      {
        href: '/portal/storage-unit',
        labelKey: 'nav.storage',
        icon: Boxes,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/coleta',
        labelKey: 'nav.pickup',
        icon: PackageCheck,
        roles: [Role.ADMIN, Role.DRIVER],
      },
    ],
  },
  {
    labelKey: 'nav.landingPage',
    icon: Globe,
    roles: [Role.ADMIN, Role.OPS],
    children: [
      {
        href: '/portal/blog',
        labelKey: 'nav.blog',
        icon: NewspaperIcon,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/blog-categories',
        labelKey: 'nav.categories',
        icon: Tags,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/faq',
        labelKey: 'nav.faq',
        icon: HelpCircle,
        roles: [Role.ADMIN, Role.OPS],
      },
    ],
  },
  {
    labelKey: 'nav.settings',
    icon: Settings,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
    children: [
      {
        href: '/portal/perfil',
        labelKey: 'nav.account',
        icon: CircleUser,
        roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
      },
      {
        href: '/portal/brand',
        labelKey: 'nav.brand',
        icon: Tag,
        roles: [Role.ADMIN, Role.OPS],
      },
      {
        href: '/portal/user',
        labelKey: 'nav.users',
        icon: UserIcon,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/zona',
        labelKey: 'nav.zones',
        icon: MapPin,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/parametros',
        labelKey: 'nav.parameters',
        icon: SlidersHorizontal,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/email-log',
        labelKey: 'nav.emailLog',
        icon: Mail,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/reset-password',
        labelKey: 'nav.resetPassword',
        icon: KeyRound,
        roles: [Role.ADMIN],
      },
      {
        href: '/portal/bags',
        labelKey: 'nav.packageBags',
        icon: Package,
        roles: [Role.ADMIN],
      },
    ],
  },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
