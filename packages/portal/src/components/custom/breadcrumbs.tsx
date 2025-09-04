'use client';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { routeToTitle } from '@/lib/utils';

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <Breadcrumb className="px-4 sm:px-6 lg:px-8 ">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((seg, idx) => {
          const href = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={href}
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'font-semibold' : undefined}
                >
                  {routeToTitle(href) && routeToTitle(href) !== 'Page Title'
                    ? routeToTitle(href)
                    : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
