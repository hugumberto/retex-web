'use client';
import { useAppStore } from '@/store';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

export const Breadcrumbs = () => {
  const { breadcrumbs } = useAppStore();

  return (
    <Breadcrumb className="px-4 sm:px-6 lg:px-8 ">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/portal">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((seg, idx) => {
          const { label, href } = seg;
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={href}
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'font-semibold' : undefined}
                >
                  {label.toUpperCase()}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
