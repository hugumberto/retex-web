import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Kicker, Section } from './ui';

// As três saídas (3A/3B/3C) têm cor própria; recolha e triagem são neutras.
const STAGES = [
  { key: 'collection', card: 'bg-panel', body: 'text-ink' },
  { key: 'sorting', card: 'bg-panel', body: 'text-ink' },
  { key: 'reuse', card: 'bg-sky', body: 'text-navy' },
  { key: 'upcycling', card: 'bg-mint', body: 'text-navy' },
  { key: 'recycling', card: 'bg-line', body: 'text-navy' },
] as const;

export default function HomeJourney() {
  const t = useTranslations('home.journey');

  return (
    <Section
      id="percurso"
      className="border-t border-line bg-white py-20"
      innerClassName="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="flex w-full max-w-[400px] flex-col gap-[18px]">
        <Kicker>{t('kicker')}</Kicker>
        <h2 className="max-w-[320px] text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[40px]">
          {t('title')}
        </h2>
        <p className="text-[15px] leading-[26px] text-ink">
          {t('description')}
        </p>
        <div className="grid grid-cols-2 gap-2.5 pt-2.5">
          {(['percurso-1', 'percurso-2'] as const).map((photo, i) => (
            <div
              key={photo}
              className="relative h-[180px] overflow-hidden rounded-xl"
            >
              <Image
                src={`/assets/landing/${photo}.jpg`}
                alt={t(`photoAlt.${i}`)}
                fill
                sizes="(min-width: 1024px) 195px, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <ol className="grid w-full max-w-[716px] grid-cols-2 gap-3.5 sm:grid-cols-4">
        {STAGES.map(({ key, card, body }) => (
          <li
            key={key}
            className={cn(
              'flex min-h-[200px] flex-col gap-2.5 rounded-[14px] py-[22px] pl-5 pr-4 sm:min-h-[230px]',
              card
            )}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink">
              {t(`stages.${key}.step`)}
            </span>
            <h3 className="text-[17px] font-bold leading-6 text-navy">
              {t(`stages.${key}.title`)}
            </h3>
            <p className={cn('text-[13px] leading-5', body)}>
              {t(`stages.${key}.description`)}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
