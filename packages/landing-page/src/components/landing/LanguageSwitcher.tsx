'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';

// `compact`: o seletor do novo cabeçalho ("PT ⌄"), só com o código do idioma.
export default function LanguageSwitcher({
  variant = 'default',
}: {
  variant?: 'default' | 'compact';
}) {
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
    <label
      className={
        variant === 'compact'
          ? 'relative inline-flex items-center text-sm font-medium text-navy'
          : 'landing-lang-switcher'
      }
    >
      <span className="sr-only">{t('label')}</span>
      <select
        value={locale}
        disabled={isPending}
        aria-label={t('label')}
        onChange={(event) => onChange(event.target.value)}
        className={
          variant === 'compact'
            ? 'cursor-pointer appearance-none bg-transparent pr-4 font-medium text-navy focus:outline-none'
            : undefined
        }
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {variant === 'compact'
              ? option.toUpperCase()
              : localeLabels[option]}
          </option>
        ))}
      </select>
      {variant === 'compact' ? (
        <span aria-hidden className="pointer-events-none absolute right-0 text-xs">
          ⌄
        </span>
      ) : null}
    </label>
  );
}
