'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const onChange = (nextLocale: string) => {
    // `pathname` já vem sem o prefixo de idioma, por isso basta reencaminhar
    // para a mesma rota com o novo locale — o visitante não perde a página.
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params dinâmicos (ex.: [slug]) são repassados tal e qual
        { pathname, params },
        { locale: nextLocale as Locale }
      );
    });
  };

  return (
    <label className="landing-lang-switcher">
      <span className="sr-only">{t('label')}</span>
      <select
        value={locale}
        disabled={isPending}
        aria-label={t('label')}
        onChange={(event) => onChange(event.target.value)}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {localeLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
