import { defineRouting } from 'next-intl/routing';

export const locales = ['pt', 'en', 'es', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt';

// Etiquetas usadas no seletor de idioma. Cada idioma escreve-se no próprio
// idioma — é o que o visitante reconhece quando o site está numa língua que
// não percebe.
export const localeLabels: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

// Código completo para a tag <html lang> e para og:locale.
export const localeHtmlLang: Record<Locale, string> = {
  pt: 'pt-PT',
  en: 'en',
  es: 'es',
  fr: 'fr',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // `as-needed`: o português continua em retex.pt/faq (sem prefixo), os outros
  // idiomas ficam em /en/faq, /es/faq, /fr/faq. Mantém intactos os URLs já
  // indexados pelo Google.
  localePrefix: 'as-needed',
});
