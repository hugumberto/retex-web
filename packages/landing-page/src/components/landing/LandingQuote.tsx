import { useTranslations } from 'next-intl';

export default function LandingQuote() {
  const t = useTranslations('quote');

  return (
    <section className="quote-section" aria-labelledby="quote-heading">
      <span className="quote-watermark quote-watermark--left" aria-hidden>
        ♻
      </span>
      <span className="quote-watermark quote-watermark--right" aria-hidden>
        ♻
      </span>
      <p className="quote-mark">“</p>
      <blockquote className="quote-body" id="quote-heading">
        {t('body')}
      </blockquote>
      <p className="quote-author">{t('author')}</p>
    </section>
  );
}
