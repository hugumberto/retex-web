import { Header } from '@/components/landing/Header';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function LandingHero() {
  const t = useTranslations('hero');

  return (
    <section className="landing-hero">
      <Header />
      <Image
        src="/assets/new-layout/FUNDO_HOMEPAGE.jpg"
        alt=""
        fill
        className="landing-hero-bg object-cover"
        priority
        sizes="100vw"
      />
      <div className="landing-hero-overlay" />
      <div className="landing-hero-content">
        <h1 className="landing-hero-title">
          <span>wear.</span>
          <span>care.</span>
          <span>share.</span>
          <span>repeat.</span>
        </h1>
        <p>{t('tagline')}</p>
      </div>
    </section>
  );
}
