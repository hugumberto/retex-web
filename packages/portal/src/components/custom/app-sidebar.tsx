'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

// shadcn/ui sidebar v3.1 — dá o comportamento (gaveta no telemóvel); o aspeto
// é o do Figma "RETEX Backoffice".
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { getUserRoles, hasCompanyAccess } from '@/lib/access-control';
import {
  findActiveNav,
  NAV_SECTIONS,
  primaryRole,
} from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import EnvBadge from './env-badge';
import { LanguageSwitcher } from './language-switcher';

export function AppSidebar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { user, companyContext } = useAppStore();
  const { setOpenMobile } = useSidebar();
  const userRoles = getUserRoles(user);
  const role = primaryRole(userRoles);
  const activeHref = findActiveNav(pathname)?.item.href;

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.roles.some((r) => userRoles.includes(r)) &&
        hasCompanyAccess(companyContext, item)
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <Sidebar collapsible="offcanvas" className="border-0">
      <SidebarHeader className="px-[14px] pb-0 pt-8">
        <div className="flex items-center justify-between pl-2.5 pr-1.5">
          <Link href="/portal" aria-label="ReTeX:ID">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-branco.svg"
              alt="ReTeX:ID"
              width={113}
              height={20}
            />
          </Link>
          {role ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/60">
              {t(`roles.${role}`)}
            </span>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-[14px] pt-[30px]">
        <nav aria-label={tCommon('navigation')} className="flex flex-col gap-1">
          {sections.map((section, index) => (
            <div key={section.labelKey ?? index} className="flex flex-col gap-1">
              {section.labelKey ? (
                <p className="pb-1 pl-3 pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                  {t(`sections.${section.labelKey}`)}
                </p>
              ) : null}
              {section.items.map((item) => {
                // Só o item mais específico fica ativo: em
                // /portal/my-company/members não se acende também a ficha.
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMobile(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-[42px] items-center justify-between rounded-lg pl-3 pr-2.5 text-sm transition-colors',
                      active
                        ? 'bg-white font-semibold text-navy'
                        : 'text-white/90 hover:bg-white/10'
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-4 px-6 pb-6 pt-4 text-white">
        <div className="[&_button]:border-white/30 [&_button]:bg-transparent [&_button]:text-white [&_svg]:text-white/70">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
            {user
              ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
              : '·'}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {user ? `${user.firstName} ${user.lastName}` : tCommon('user')}
          </span>
          <button
            type="button"
            onClick={() => useAppStore.getState().logout()}
            title={tCommon('logout')}
            aria-label={tCommon('logout')}
            className="shrink-0 text-white/70 transition-colors hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Cabeçalho de cada página: caminho em DM Mono ("CHECK-IN / PEDIDOS DE
 * RECOLHA") e o título. A secção sai da navegação; o resto do caminho são as
 * breadcrumbs que cada página já define, e o título é o `pageTitle` dela.
 */
export function PageHeader() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { pageTitle, breadcrumbs } = useAppStore();
  const active = findActiveNav(pathname);

  const trail: { label: string; href?: string }[] = [];
  if (active?.section.labelKey) {
    trail.push({ label: t(`sections.${active.section.labelKey}`) });
  }
  if (breadcrumbs.length > 0) {
    trail.push(...breadcrumbs);
  } else if (active) {
    trail.push({ label: t(active.item.labelKey) });
  }

  return (
    <header className="flex items-start gap-3">
      <SidebarTrigger className="mt-1 text-navy md:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {trail.length > 0 ? (
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
            {trail.map((crumb, index) => {
              const isLast = index === trail.length - 1;
              return (
                <span key={`${crumb.label}-${index}`}>
                  {index > 0 ? ' / ' : ''}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="hover:text-navy">
                      {crumb.label}
                    </Link>
                  ) : (
                    crumb.label
                  )}
                </span>
              );
            })}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-left text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[28px]">
            {pageTitle || (active ? t(active.item.labelKey) : tCommon('home'))}
          </h1>
          <EnvBadge />
        </div>
      </div>
    </header>
  );
}
