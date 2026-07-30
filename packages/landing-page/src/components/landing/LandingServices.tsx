import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function LandingServices() {
  const t = useTranslations('services');

  return (
    <section id="servicos" className="landing-grid-two">
      <article className="split-card split-text split-text--empresas">
        <h3>{t('companies.title')}</h3>
        <p>{t('companies.body')}</p>
        <a href="#formulario" className="primary-pill">
          {t('companies.cta')}
        </a>
      </article>
      <article className="split-card split-image-only">
        <Image
          src="/assets/new-layout/EMPRESAS.jpg"
          alt={t('companies.imageAlt')}
          width={1019}
          height={910}
          className="split-image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </article>
      <article className="split-card split-image-only">
        <Image
          src="/assets/new-layout/PARTICULARES.jpeg"
          alt={t('individuals.imageAlt')}
          width={1073}
          height={679}
          className="split-image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </article>
      <article className="split-card split-text split-text--particular">
        <h3>{t('individuals.title')}</h3>
        <p>{t('individuals.body')}</p>
        <Link href="/register" className="landing-outline-btn">
          {t('individuals.cta')}
        </Link>
      </article>
    </section>
  );
}
