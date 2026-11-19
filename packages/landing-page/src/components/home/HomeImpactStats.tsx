import { localeHtmlLang, type Locale } from '@/i18n/routing';
import { getLocale, getTranslations } from 'next-intl/server';
import { Section } from './ui';

// Contrato de GET /dashboard/public (retex-api).
type PublicImpactStats = {
  collectedKg: number;
  citiesServed: number;
  reusedPercent: number | null;
  co2AvoidedKg: number;
  updatedAt: string;
};

// A landing é estática; os números refrescam no máximo de hora a hora.
const REVALIDATE_SECONDS = 3600;

async function fetchStats(): Promise<PublicImpactStats | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}dashboard/public`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicImpactStats;
  } catch {
    return null;
  }
}

/**
 * "Até agora": números reais da operação. Sem resposta da API, ou sem nada
 * recolhido ainda, a secção não aparece — nunca se mostram zeros nem
 * marcadores na página pública.
 */
export default async function HomeImpactStats() {
  const stats = await fetchStats();
  if (!stats || stats.collectedKg <= 0) return null;

  const t = await getTranslations('home.impact');
  const lang = localeHtmlLang[(await getLocale()) as Locale] ?? 'pt-PT';
  const number = (value: number, digits = 0) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(value);

  // Abaixo de uma tonelada mostra-se em kg: "0,4 t" diz menos do que "420 kg".
  const weight = (kg: number) =>
    kg >= 1000
      ? { value: number(kg / 1000, kg >= 10000 ? 0 : 1), unit: 't' }
      : { value: number(kg), unit: 'kg' };

  const items = [
    { ...weight(stats.collectedKg), label: t('collected') },
    { value: number(stats.citiesServed), unit: '', label: t('cities') },
    stats.reusedPercent == null
      ? null
      : { value: number(stats.reusedPercent), unit: '%', label: t('reused') },
    { ...weight(stats.co2AvoidedKg), label: t('co2') },
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const updatedAt = new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(stats.updatedAt));

  return (
    <Section className="bg-mist pb-[50px] pt-20">
      <div className="flex flex-col gap-2 border-b-[1.5px] border-slate pb-[18px] sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-[34px] font-bold tracking-[-0.03em] text-navy sm:text-[40px]">
          {t('title')}
        </h2>
        <p className="font-mono text-[11px] text-ink">
          {t('updatedAt', { date: updatedAt })}
        </p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-y-8 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dd className="order-1 flex items-baseline gap-1.5 text-navy">
              <span className="text-[52px] font-semibold tracking-[-0.03em] sm:text-[72px]">
                {item.value}
              </span>
              {item.unit ? (
                <span className="text-[32px] font-bold sm:text-[44px]">
                  {item.unit}
                </span>
              ) : null}
            </dd>
            <dt className="order-2 text-[15px] text-ink">{item.label}</dt>
          </div>
        ))}
      </dl>
    </Section>
  );
}
