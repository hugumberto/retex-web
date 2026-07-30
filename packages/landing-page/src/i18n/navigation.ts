import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Usar estes wrappers em vez de `next/link` e `next/navigation`: acrescentam
// automaticamente o prefixo do idioma activo ao href.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
