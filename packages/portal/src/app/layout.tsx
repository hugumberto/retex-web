import type { Metadata, Viewport } from 'next';
import './global.css';
import PwaRegister from './pwa-register';

export const metadata: Metadata = {
  applicationName: 'Retex Portal',
  title: {
    default: 'Retex Portal',
    template: '%s · Retex',
  },
  description: 'Portal de gestão de recolhas e reutilização de têxteis Retex.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Retex',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#013364',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
