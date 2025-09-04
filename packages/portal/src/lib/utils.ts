import { clsx, type ClassValue } from "clsx"
import { LayoutDashboard, ClipboardList, Boxes, UserIcon } from "lucide-react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const NAV_ITEMS = [
  { href: '/', label: 'HOME', icon: LayoutDashboard },
  {
    href: '/package-collection',
    label: 'RECOLHA',
    icon: ClipboardList,
  },
  { href: '/storage-unit', label: 'ARMAZENAMENTO', icon: Boxes },
  { href: '/user', label: 'UTILIZADOR', icon: UserIcon },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}


