'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-0 rounded-tr-3xl rounded-br-3xl">
      <SidebarHeader className="px-6 pt-6 flex justify-center items-center">
        <span className="text-lg font-bold text-primary">retex ai</span>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/portal'
                  ? pathname === '/portal'
                  : pathname?.startsWith(href) &&
                    (pathname.length === href.length || pathname.charAt(href.length) === '/');
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
                        : 'hover:bg-secondary/40',
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
        <div
          className="mt-6 size-10 rounded-full"
          style={{ background: 'linear-gradient(180deg, #0b6b79 0%, #00364a 100%)' }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function RetexAiTopBar() {
  const { pageTitle } = useAppStore();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Title>{pageTitle || 'Retex AI'}</Title>
        <div className="ml-auto flex items-center gap-5">
          <Bell className="size-5" />
          <div
            className="size-10 rounded-full"
            style={{ background: 'linear-gradient(180deg, #0b6b79 0%, #00364a 100%)' }}
          />
        </div>
      </div>
      <div className="h-[2px] w-full bg-secondary-muted" />
    </header>
  );
}
