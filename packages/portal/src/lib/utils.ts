import { clsx, type ClassValue } from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  UserIcon,
  RefreshCw,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const NAV_ITEMS = [
  { href: '/portal', label: 'HOME', icon: LayoutDashboard },
  { href: '/portal/triage', label: 'TRIAGE', icon: RefreshCw },
  {
    href: '/portal/package-collection',
    label: 'RECOLHA',
    icon: ClipboardList,
  },
  { href: '/portal/storage-unit', label: 'ARMAZENAMENTO', icon: Boxes },
  { href: '/portal/user', label: 'UTILIZADOR', icon: UserIcon },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
