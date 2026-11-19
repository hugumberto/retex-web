import { localeHtmlLang, type Locale } from '@/i18n/config';
import type { Metadata, Viewport } from 'next';
import { DM_Mono, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './global.css';
import PwaRegister from './pwa-register';

// Tipografia da marca (Figma "Portal"): Poppins no texto, DM Mono nos rótulos
// técnicos (caminhos, códigos, contadores).
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
  display: 'swap',
});

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
    <html
      lang={localeHtmlLang[locale as Locale] ?? localeHtmlLang.pt}
      className={`${poppins.variable} ${dmMono.variable}`}
    >
      <body className={`${poppins.className} text-navy antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
