import { Camera, LayoutDashboard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NAV_ITEMS = [
  { href: '/portal', label: 'HOME', icon: LayoutDashboard },
  { href: '/portal/camera', label: 'CÂMERA', icon: Camera },
];

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
