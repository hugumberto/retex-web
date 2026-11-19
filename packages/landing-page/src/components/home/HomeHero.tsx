import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { buttonClass, Kicker } from './ui';

export default function HomeHero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-brand-diagonal px-4 pb-20 pt-16 text-white sm:px-8 lg:pt-24">
      <div className="mx-auto flex w-full max-w-[1164px] flex-col items-start gap-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-[479px] flex-col items-start gap-6">
          <Kicker className="text-white/75">{t('kicker')}</Kicker>
          <h1 className="text-[56px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[84px]">
            <span className="block">wear.</span>
            <span className="block">care.</span>
            <span className="block">share.</span>
            <span className="block text-sky">repeat.</span>
          </h1>
          <p className="max-w-[420px] text-lg leading-[30px] text-white/90">
            {t('description')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass('white')}>
              {t('primaryCta')}
            </Link>
            <Link
              href="/?perfil=empresa#contacto"
              className={buttonClass('outline-white')}
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </div>

        {/* Ilustração: fotografia com o cartão de uma recolha de exemplo. */}
        <div className="relative w-full max-w-[560px] self-center lg:h-[460px]">
          <div className="relative ml-auto aspect-[460/404] w-[82%] overflow-hidden rounded-[20px]">
            <Image
              src="/assets/landing/hero.jpg"
              alt={t('photoAlt')}
              fill
              priority
              sizes="(min-width: 1024px) 460px, 82vw"
              className="object-cover"
            />
          </div>
          <PickupCard />
        </div>
      </div>
    </section>
  );
}

function PickupCard() {
  const t = useTranslations('home.hero.card');
  const rows = [
    [t('dateLabel'), t('date')],
    [t('placeLabel'), t('place')],
    [t('bagsLabel'), t('bags')],
  ];

  return (
    <div
      aria-hidden
      className="absolute left-0 top-[12%] w-[min(330px,62%)] -rotate-[4deg] rounded-[14px] bg-white px-[22px] pb-[18px] pt-[22px] text-navy shadow-[0_12px_30px_rgba(0,26,51,0.25)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px]">RTX-0412</span>
        <span className="rounded-full bg-mint px-2.5 py-[3px] text-[11px] font-semibold text-forest">
          {t('status')}
        </span>
      </div>
      <p className="mt-2.5 text-lg font-bold leading-[26px] tracking-[-0.01em] sm:text-xl">
        {t('title')}
      </p>
      <dl className="mt-2.5 flex flex-col gap-1.5 font-mono">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-2.5">
            <dt className="w-11 shrink-0 text-[10px] text-ink">{label}</dt>
            <dd className="text-[11px]">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 flex items-start justify-between border-t border-dashed border-line pt-2.5 font-mono text-ink">
        <span className="text-xs">◻ △ ◯ A</span>
        <span className="text-[9px] tracking-[0.08em]">MADE IN PT</span>
      </div>
    </div>
  );
}
