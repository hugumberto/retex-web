import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function LandingAbout() {
  const t = useTranslations('about');

  return (
    <section id="sobre-nos" className="who-section">
      <div className="who-logo">
        <Image
          src="/assets/new-layout/RETEX_LOGO.jpg"
          alt={t('logoAlt')}
          width={260}
          height={100}
        />
      </div>
      <div className="who-text">
        <h2>{t('title')}</h2>
        <p>
          {t.rich('body1', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p>{t('body2')}</p>
        <button type="button" className="who-cta-btn">
          {t('cta')}
        </button>
      </div>
    </section>
  );
}
