import LandingFaq from '@/components/landing/LandingFaq';
import SiteFooter from '@/components/home/SiteFooter';
import SiteHeader from '@/components/home/SiteHeader';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.faq' });

  return { title: t('title'), description: t('description') };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="landing-shell flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex-1 mt-[4rem]">
        <LandingFaq />
      </div>
      <SiteFooter />
    </main>
  );
}
