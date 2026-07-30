import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import ptMessages from './messages/pt.json';
import { defaultLocale, routing } from './routing';

type Messages = Record<string, unknown>;

// Fallback para PT: uma chave ainda não traduzida cai no texto português em vez
// de rebentar em produção ou mostrar a chave crua ao visitante. Permite traduzir
// de forma incremental.
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
      result[key] = mergeWithFallback(
        baseValue as Messages,
        value as Messages
      );
    } else if (value !== '' && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : defaultLocale;

  const messages =
    locale === defaultLocale
      ? (ptMessages as Messages)
      : mergeWithFallback(
          ptMessages as Messages,
          (await import(`./messages/${locale}.json`)).default as Messages
        );

  return { locale, messages };
});
