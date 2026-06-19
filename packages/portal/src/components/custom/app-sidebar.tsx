'use client';

import { Bell, Info, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn, NAV_ITEMS } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Label } from '../ui/label';
import Title from './title';
import { getUserRoles } from '@/lib/access-control';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const userRoles = getUserRoles(user);

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
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
          <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {visibleNavItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/portal'
                  ? pathname === '/portal'
                  : pathname?.startsWith(href) &&
                    (pathname.length === href.length ||
                      pathname.charAt(href.length) === '/');
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      'px-3 py-3 rounded-lg text-[13px] tracking-wide',
                      '[&_*]:text-secondary',
                      active && '[&_*]:text-white',
                      'hover:[&_*]:text-white',
                      active
                        ? 'bg-secondary/60 font-semibold shadow-sm text-white'
                        : 'hover:bg-secondary/40'
                    )}
                  >
                    <Link href={href}>
                      <Icon className={cn('size-5')} />
                      <Label className="text-[13px]">{label}</Label>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-6 pb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex size-6 items-center justify-center rounded-full border">
            <Info className="size-3.5" />
          </span>
          <span className="font-medium">Info</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div
            className="size-10 rounded-full shrink-0"
            style={{
              background: 'linear-gradient(180deg, #0b6b79 0%, #00364a 100%)',
            }}
          />
          <div className="text-sm font-semibold min-w-0 truncate flex-1">
            {user ? `${user.firstName} ${user.lastName}` : 'Utilizador'}
          </div>
          <button
            onClick={() => useAppStore.getState().logout()}
            title="Terminar sessão"
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
  const { pageTitle } = useAppStore();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Title>{pageTitle || 'Page Title'}</Title>

        <div className="ml-auto flex items-center gap-5">
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
