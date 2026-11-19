import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Section } from './ui';

// Só parceiros confirmados. O Figma tem mais três lugares por preencher
// ("[logótipo]"): ficam de fora até haver nomes e logótipos reais.
const PARTNERS = [
  { name: 'Maia Ambiente', href: null },
  { name: 'PRR', href: '/projeto-prr' },
] as const;

export default function HomePartners() {
  const t = useTranslations('home.partners');
  const tile =
    'flex h-[88px] items-center justify-center rounded-xl border border-dashed border-field text-[13px] text-ink';

  return (
    <Section className="bg-mist pb-[90px] pt-[30px]">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink">
        {t('label')}
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PARTNERS.map((partner) => (
          <li key={partner.name}>
            {partner.href ? (
              <Link href={partner.href} className={`${tile} hover:bg-white`}>
                {partner.name}
              </Link>
            ) : (
              <span className={tile}>{partner.name}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
