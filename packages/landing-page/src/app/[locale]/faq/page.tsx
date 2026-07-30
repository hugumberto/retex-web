import LandingFaq from '@/components/landing/LandingFaq';
import LandingFooter from '@/components/landing/LandingFooter';
import { Header } from '@/components/landing/Header';
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
      <Header />
      <div className="flex-1 mt-[4rem]">
        <LandingFaq />
      </div>
      <LandingFooter />
    </main>
  );
}
