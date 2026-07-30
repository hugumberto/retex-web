import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import ptMessages from './messages/pt.json';
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config';

type Messages = Record<string, unknown>;

/**
 * Fallback para PT: uma chave ainda sem tradução cai no texto português em vez
 * de aparecer crua na interface. Permite traduzir de forma incremental.
 */
function mergeWithFallback(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue !== null &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeWithFallback(baseValue as Messages, value as Messages);
    } else if (value !== '' && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * O portal não tem prefixo de idioma no URL (é uma aplicação autenticada, sem
 * SEO): o idioma vem do cookie que o seletor grava, e por omissão é português.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(requested) ? requested : defaultLocale;

  const messages =
    locale === defaultLocale
      ? (ptMessages as Messages)
      : mergeWithFallback(
          ptMessages as Messages,
          (await import(`./messages/${locale}.json`)).default as Messages
        );

  return { locale, messages };
});
