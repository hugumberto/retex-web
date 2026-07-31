import ContactForm from '@/components/landing/ContactForm';
import { useTranslations } from 'next-intl';

export default function LandingContactSection() {
  const t = useTranslations('contact');

  return (
    <section className="landing-form" id="formulario">
      <h2>{t('title')}</h2>
      <p>
        <strong>{t('leadStrong')}</strong>
        <br />
        {t('lead')}
      </p>
      <ContactForm />
    </section>
  );
}
