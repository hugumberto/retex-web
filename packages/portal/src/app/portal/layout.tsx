import '../global.css';

// shadcn/ui sidebar v3.1
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AppSidebar, PageHeader } from '@/components/custom/app-sidebar';
import ImpersonationBanner from '@/components/custom/impersonation-banner';
import PortalToaster from '@/components/custom/portal-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';
import AuthBootstrapper from './guard/auth-bootstrapper';
import CompanyBootstrapper from './guard/company-bootstrapper';
import Protected from './guard/guard';

export const metadata = {
  title: 'Retex Portal',
  description: 'Portal de gestão de recolhas e reutilização de têxteis Retex.',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sem <html>/<body> próprios: quem os define é o layout raiz, já com o
  // idioma resolvido.
  return (
    <>
      <AuthBootstrapper />
      <CompanyBootstrapper />
      <PortalToaster />
      <SidebarProvider
        // Largura da barra lateral do Figma "RETEX Backoffice".
        style={{ '--sidebar-width': '232px' } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-canvas">
          <ImpersonationBanner />
          <div className="flex min-h-dvh flex-col gap-5 px-4 pb-10 pt-6 sm:px-6 lg:px-9">
            <PageHeader />
            <TooltipProvider>
              <Protected>{children}</Protected>
            </TooltipProvider>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
