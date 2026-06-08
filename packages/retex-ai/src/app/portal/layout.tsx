import { Toaster } from 'sonner';
import '../global.css';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, RetexAiTopBar } from '@/components/custom/app-sidebar';
import { Breadcrumbs } from '@/components/custom/breadcrumbs';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthBootstrapper from './guard/auth-bootstrapper';
import Protected from './guard/guard';
import React from 'react';

export const metadata = {
  title: 'Retex AI — Portal',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <AuthBootstrapper />
        <Toaster richColors />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-white">
            <RetexAiTopBar />
            <main className="relative min-h-[calc(100dvh-4rem)] flex flex-col">
              <div className="flex-1 p-4 sm:p-6 lg:p-8">
                <Breadcrumbs />
                <TooltipProvider>
                  <Protected>{children}</Protected>
                </TooltipProvider>
              </div>
              <footer className="w-full flex justify-center items-center py-6 mt-auto">
                <span className="text-[11px] tracking-wide text-[#0b6b79]">
                  retex ai — wear. care. share. repeat.
                </span>
              </footer>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
