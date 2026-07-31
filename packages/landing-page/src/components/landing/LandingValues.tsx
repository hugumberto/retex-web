import { useTranslations } from 'next-intl';

const values = [
  {
    key: 'collection',
    icon: '/assets/new-layout/values/fi-rs-truck-side.svg',
  },
  {
    key: 'waste',
    icon: '/assets/new-layout/values/fi-rs-hand-holding-heart.svg',
  },
  {
    key: 'impact',
    icon: '/assets/new-layout/values/fi-rs-leaf.svg',
  },
  {
    key: 'circular',
    icon: '/assets/new-layout/values/fi-rr-refresh.svg',
  },
] as const;

export default function LandingValues() {
  const t = useTranslations('values');

  return (
    <section className="values-section">
      <p className="values-kicker">{t('kicker')}</p>
      <h2>{t('title')}</h2>
      <div className="values-grid">
        {values.map((item) => (
          <article key={item.key} className="value-card">
            <span className="value-card-icon">
              <span
                className="value-card-glyph"
                style={{
                  WebkitMaskImage: `url(${item.icon})`,
                  maskImage: `url(${item.icon})`,
                }}
              />
            </span>
            <h3>{t(`items.${item.key}.title`)}</h3>
            <p>{t(`items.${item.key}.text`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
