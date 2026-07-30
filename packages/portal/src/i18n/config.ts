export const locales = ['pt', 'en', 'es', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt';

/** Cookie onde fica o idioma escolhido no portal. */
export const LOCALE_COOKIE = 'retex_locale';

export const localeLabels: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const localeHtmlLang: Record<Locale, string> = {
  pt: 'pt-PT',
  en: 'en',
  es: 'es',
  fr: 'fr',
};

export function isLocale(value?: string | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
