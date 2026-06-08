import { clsx, type ClassValue } from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Tag,
  UserIcon,
  RefreshCw,
  HandHelping,
  Camera,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Role } from '@/app/types/user';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/portal',
    label: 'HOME',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.OPS, Role.DRIVER, Role.USER],
  },
  {
    href: '/portal/triage',
    label: 'TRIAGE',
    icon: RefreshCw,
    roles: [Role.ADMIN, Role.OPS],
  },
  {
    href: '/portal/collection-request',
    label: 'SOLICITAR COLETA',
    icon: HandHelping,
    roles: [Role.ADMIN, Role.OPS, Role.USER],
  },
  {
    href: '/portal/package-collection',
    label: 'RECOLHA',
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
    href: '/portal/brand',
    label: 'MARCA',
    icon: Tag,
    roles: [Role.ADMIN, Role.OPS],
  },
  {
    href: '/portal/user',
    label: 'UTILIZADOR',
    icon: UserIcon,
    roles: [Role.ADMIN],
  },
  {
    href: '/portal/camera',
    label: 'CÂMERA',
    icon: Camera,
    roles: [Role.ADMIN, Role.OPS],
  },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
