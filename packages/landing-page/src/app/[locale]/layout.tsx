import { locales, localeHtmlLang, routing, type Locale } from '@/i18n/routing';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';
import { DM_Mono, Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import '../global.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Tipografia da marca: Poppins no texto e títulos, DM Mono nos rótulos
// técnicos (kickers, códigos, legendas).
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

const SITE_URL = 'https://retex.pt';

const OG_LOCALE: Record<Locale, string> = {
  pt: 'pt_PT',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.home' });

  // hreflang: o português vive na raiz (localePrefix 'as-needed'), os restantes
  // idiomas em /<locale>.
  const languages = Object.fromEntries(
    locales.map((l) => [
      localeHtmlLang[l],
      l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`,
    ])
  );

  const canonical =
    locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    keywords: t('keywords')
      .split(',')
      .map((keyword) => keyword.trim()),
    alternates: {
      canonical,
      languages: { ...languages, 'x-default': SITE_URL },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonical,
      siteName: 'RETEX',
      images: [
        {
          url: `${SITE_URL}/logo_circular.jpg`,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
      locale: OG_LOCALE[locale as Locale] ?? OG_LOCALE.pt,
      type: 'website',
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Necessário para as páginas continuarem a ser renderizadas estaticamente.
  setRequestLocale(locale);

  return (
    <html
      lang={localeHtmlLang[locale]}
      className={`${poppins.variable} ${dmMono.variable}`}
    >
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-X2G04J7NPJ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X2G04J7NPJ');
          `}
      </Script>
      <body className={poppins.className}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
