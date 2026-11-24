'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** Separadores "Artigos · N" / "Categorias · N" no topo do blog. */
export default function BlogTabs({
  active,
  posts,
  categories,
}: {
  active: 'posts' | 'categories';
  posts: number | null;
  categories: number | null;
}) {
  const t = useTranslations('blogList');
  const tab = (key: 'posts' | 'categories', href: string, count: number | null) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center rounded-full border-[1.5px] px-4 text-[13px] font-semibold',
        active === key ? 'border-navy bg-navy text-white' : 'border-navy bg-white text-navy hover:bg-panel'
      )}
    >
      {t(`tabs.${key}`)}
      {count !== null ? ` · ${count}` : ''}
    </Link>
  );
  return (
    <nav className="flex gap-2">
      {tab('posts', '/portal/blog', posts)}
      {tab('categories', '/portal/blog/categorias', categories)}
    </nav>
  );
}
