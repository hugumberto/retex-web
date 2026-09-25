import LandingFooter from '@/components/landing/LandingFooter';
import LandingPrrProject from '@/components/landing/LandingPrrProject';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.prr' });

  return { title: t('title'), description: t('description') };
}

export default async function ProjetoPrrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="landing-shell">
      <LandingPrrProject />
      <LandingFooter />
    </main>
  );
}
