'use client';

import { Bell, ChevronDown, Info, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// shadcn/ui sidebar v3.1
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { getUserRoles } from '@/lib/access-control';
import { cn, isNavGroup, NAV_ITEMS, NavGroup, NavLeaf } from '@/lib/utils';
import { Role } from '@/app/types/user';
import { useAppStore } from '@/store';
import { Label } from '../ui/label';
import { LanguageSwitcher } from './language-switcher';
import Title from './title';

const isPathActive = (pathname: string | null, href: string): boolean => {
  if (href === '/portal') return pathname === '/portal';
  return (
    !!pathname &&
    pathname.startsWith(href) &&
    (pathname.length === href.length || pathname.charAt(href.length) === '/')
  );
};

const leafButtonClasses = (active: boolean) =>
  cn(
    'px-3 py-3 rounded-lg text-[13px] tracking-wide',
    '[&_*]:text-secondary',
    active && '[&_*]:text-white',
    'hover:[&_*]:text-white',
    active
      ? 'bg-secondary/60 font-semibold shadow-sm text-white'
      : 'hover:bg-secondary/40'
  );

function NavLeafItem({ item, active }: { item: NavLeaf; active: boolean }) {
  const t = useTranslations();
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={leafButtonClasses(active)}
      >
        <Link href={item.href}>
          <Icon className={cn('size-5')} />
          <Label className="text-[13px]">{t(item.labelKey)}</Label>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupItem({
  group,
  userRoles,
  pathname,
}: {
  group: NavGroup;
  userRoles: Role[];
  pathname: string | null;
}) {
  const t = useTranslations();
  const children = group.children.filter((child) =>
    child.roles.some((role) => userRoles.includes(role))
  );
  const anyActive = children.some((child) =>
    isPathActive(pathname, child.href)
  );
  const [open, setOpen] = useState(anyActive);

  // Keep the group open when navigating into one of its children.
  useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);

  if (children.length === 0) return null;

  const Icon = group.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((value) => !value)}
        className={leafButtonClasses(false)}
      >
        <Icon className={cn('size-5')} />
        <Label className="text-[13px] flex-1 text-left cursor-pointer">
          {t(group.labelKey)}
        </Label>
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </SidebarMenuButton>

      {open && (
        <SidebarMenuSub>
          {children.map((child) => {
            const active = isPathActive(pathname, child.href);
            const ChildIcon = child.icon;
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={active}
                  className={leafButtonClasses(active)}
                >
                  <Link href={child.href}>
                    <ChildIcon className={cn('size-4')} />
                    <span className="text-[13px]">{t(child.labelKey)}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const { user } = useAppStore();
  const userRoles = getUserRoles(user);

  const visibleNavItems = NAV_ITEMS.filter((entry) =>
    entry.roles.some((role) => userRoles.includes(role))
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-0 rounded-tr-3xl rounded-br-3xl"
    >
      <SidebarHeader className="px-6 pt-6 flex justify-center items-center">
        <Image
          src="/assets/logo.png"
          alt="retex"
          height={28}
          width={207}
          className="h-12 opacity-90"
          style={{ width: 'auto' }}
          priority
        />
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">
            {t('navigation')}
          </SidebarGroupLabel>
          <SidebarMenu>
            {visibleNavItems.map((entry) =>
              isNavGroup(entry) ? (
                <NavGroupItem
                  key={entry.labelKey}
                  group={entry}
                  userRoles={userRoles}
                  pathname={pathname}
                />
              ) : (
                <NavLeafItem
                  key={entry.href}
                  item={entry}
                  active={isPathActive(pathname, entry.href)}
                />
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-6 pb-6">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span className="inline-flex size-6 items-center justify-center rounded-full border">
            <Info className="size-3.5" />
          </span>
          <span className="font-medium">{t('info')}</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div
            className="size-10 rounded-full shrink-0"
            style={{
              background: 'linear-gradient(180deg, #0b6b79 0%, #00364a 100%)',
            }}
          />
          <div className="text-sm font-semibold min-w-0 truncate flex-1 text-secondary">
            {user ? `${user.firstName} ${user.lastName}` : t('user')}
          </div>
          <button
            onClick={() => useAppStore.getState().logout()}
            title={t('logout')}
            className="shrink-0 text-secondary hover:text-destructive transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function RetexTopBar() {
  const t = useTranslations('common');
  const { pageTitle } = useAppStore();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Title>{pageTitle || t('home')}</Title>

        <div className="ml-auto flex items-center gap-5">
          <LanguageSwitcher />
          <Bell className="size-5" />
          <div
            className="size-10 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #0b6b79 0%, #00364a 100%)',
            }}
          />
        </div>
      </div>
      <div className="h-[2px] w-full bg-secondary-muted" />
    </header>
  );
}
