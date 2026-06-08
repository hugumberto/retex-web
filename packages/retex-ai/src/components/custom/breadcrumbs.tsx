'use client';
import Link from 'next/link';
import { useAppStore } from '@/store';

export function Breadcrumbs() {
  const { breadcrumbs } = useAppStore();
  if (!breadcrumbs.length) return null;

  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
