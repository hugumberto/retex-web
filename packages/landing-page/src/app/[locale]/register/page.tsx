import RegistrationForm from '@/components/landing/RegistrationForm';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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

  const t = await getTranslations({ locale, namespace: 'register.panel' });
  const steps = [0, 1, 2].map((i) => ({
    title: t(`steps.${i}.title`),
    note: t.has(`steps.${i}.note`) ? t(`steps.${i}.note`) : '',
  }));

  return (
    <div className="flex min-h-screen flex-col bg-mist font-display text-navy antialiased lg:flex-row">
      {/* Painel lateral: no telemóvel encolhe para uma faixa com o logótipo. */}
      <aside className="bg-[linear-gradient(105deg,#013364_0%,#02748e_100%)] px-6 py-8 text-white sm:px-[58px] lg:flex lg:w-[44%] lg:max-w-[637px] lg:flex-col lg:justify-between lg:pb-14 lg:pt-[50px]">
        <Link href="/" aria-label="ReTeX:ID">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/landing/logo-branco.svg"
            alt="ReTeX:ID"
            width={133}
            height={24}
          />
        </Link>

        <div className="mt-10 hidden flex-col gap-7 lg:mt-0 lg:flex">
          <h2 className="max-w-[330px] text-[46px] font-bold leading-[52px] tracking-[-0.03em]">
            {t('title')}
          </h2>
          <ol className="flex flex-col gap-4 text-[15px]">
            {steps.map((step, i) => (
              <li key={step.title} className="flex items-center gap-3.5">
                <span className="font-mono text-sm text-white/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i === 0 ? (
                  <span>
                    <span className="font-semibold">{step.title}</span>
                    {step.note ? ` — ${step.note}` : ''}
                  </span>
                ) : (
                  <span className="text-white/80">{step.title}</span>
                )}
              </li>
            ))}
          </ol>
          <p className="pt-[30px] font-mono text-xs text-white/70">
            wear. care. share. repeat.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 justify-center px-4 py-10 sm:px-8 lg:pt-[66px]">
        <RegistrationForm />
      </main>
    </div>
  );
}
