import { useTranslations } from 'next-intl';

export default function LandingPartners() {
  const t = useTranslations('partners');

  return (
    <section className="partners-section">
      <h3>{t('title')}</h3>
      <div className="partners-row">
        <span className="partners-side">{t('previous')}</span>
        <div className="partner-pill" />
        <div className="partner-pill" />
        <div className="partner-pill" />
        <div className="partner-pill" />
        <span className="partners-side">{t('next')}</span>
      </div>
    </section>
  );
}
