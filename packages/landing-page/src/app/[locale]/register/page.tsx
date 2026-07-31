import { Link } from '@/i18n/navigation';
import NavCtaLink from '@/components/landing/NavCtaLink';
import RegistrationForm from '@/components/landing/RegistrationForm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.register' });

  return { title: t('title'), description: t('description') };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <section className="register-hero">
      <header className="landing-header">
        <Link href="/">
          <Image
            src="/assets/logo.png"
            alt={t('logoAlt')}
            width={196}
            height={53}
            className="landing-logo"
            priority
          />
        </Link>
        <nav className="landing-nav">
          <Link href="/#como-funciona">{t('howItWorks')}</Link>
          <Link href="/#servicos">{t('services')}</Link>
          <Link href="/#blog">{t('blog')}</Link>
          <Link href="/#faq">{t('faq')}</Link>
          <NavCtaLink />
        </nav>
      </header>

      <Image
        src="/assets/new-layout/FUNDO_HOMEPAGE.jpg"
        alt=""
        fill
        className="landing-hero-bg object-cover"
        priority
        sizes="100vw"
      />
      <div className="landing-hero-overlay" />

      <div className="register-body">
        <RegistrationForm />
      </div>
    </section>
  );
}
