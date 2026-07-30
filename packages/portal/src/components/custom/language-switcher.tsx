'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOCALE_COOKIE, localeLabels, locales, type Locale } from '@/i18n/config';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

// Um ano: a escolha do idioma é uma preferência estável, não vale a pena
// obrigar o utilizador a repeti-la a cada sessão.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: string) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    // O idioma é lido no servidor a partir do cookie, por isso é preciso
    // revalidar a árvore para as traduções novas entrarem.
    startTransition(() => router.refresh());
  };

  return (
    <Select value={locale} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger size="sm" aria-label={t('language')} className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((option: Locale) => (
          <SelectItem key={option} value={option}>
            {localeLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
