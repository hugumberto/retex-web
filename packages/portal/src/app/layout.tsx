import { localeHtmlLang, type Locale } from '@/i18n/config';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './global.css';
import PwaRegister from './pwa-register';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');

  return {
    applicationName: t('applicationName'),
    title: {
      default: t('title'),
      template: '%s · Retex',
    },
    description: t('description'),
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
}

export const viewport: Viewport = {
  themeColor: '#013364',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={localeHtmlLang[locale as Locale] ?? localeHtmlLang.pt}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
