import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { buttonClass, Section } from './ui';

export default function HomeHowItWorks() {
  const t = useTranslations('home.howItWorks');

  return (
    <Section
      id="como-funciona"
      className="bg-mist pb-20 pt-5 lg:pb-[100px]"
      innerClassName="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="flex max-w-[620px] flex-col items-start gap-7">
        <h2 className="text-[34px] font-bold tracking-[-0.03em] text-navy sm:text-[44px]">
          {t('title')}
        </h2>
        <ol className="flex w-full flex-col gap-[26px] border-l-2 border-dashed border-teal pl-[30px]">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex flex-col gap-2">
              <span className="font-mono text-xs text-teal">
                {t(`steps.${i}.meta`)}
              </span>
              <h3 className="text-xl font-bold tracking-[-0.01em] text-navy">
                {t(`steps.${i}.title`)}
              </h3>
              <p className="text-[15px] leading-[26px] text-ink">
                {t(`steps.${i}.description`)}
              </p>
            </li>
          ))}
        </ol>
        <Link href="/register" className={buttonClass('primary')}>
          {t('cta')}
        </Link>
      </div>

      <figure className="flex w-full max-w-[460px] flex-col gap-4">
        <div className="relative aspect-[460/394] w-full overflow-hidden rounded-[20px]">
          <Image
            src="/assets/landing/como-funciona.jpg"
            alt={t('photoAlt')}
            fill
            sizes="(min-width: 1024px) 460px, 100vw"
            className="object-cover"
          />
        </div>
        <figcaption className="max-w-[370px] text-[13px] leading-[22px] text-ink">
          {t('caption')}
        </figcaption>
      </figure>
    </Section>
  );
}
