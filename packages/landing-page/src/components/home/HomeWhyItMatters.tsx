import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Kicker } from './ui';

export default function HomeWhyItMatters() {
  const t = useTranslations('home.whyItMatters');

  return (
    <section
      id="porque-importa"
      className="relative scroll-mt-20 overflow-hidden px-4 py-24 text-white sm:px-8 lg:py-[110px]"
    >
      <Image
        src="/assets/landing/porque-importa.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(5,23,18,0.75)] to-[rgba(5,23,18,0.2)] to-60%" />

      <div className="relative mx-auto flex w-full max-w-[1164px] flex-col gap-5">
        <Kicker className="text-white/75">{t('kicker')}</Kicker>
        <h2 className="max-w-[620px] text-[40px] font-bold leading-[1.03] tracking-[-0.04em] sm:text-[62px]">
          {t('title')}
        </h2>
        <p className="max-w-[520px] text-[17px] leading-7 text-white/90">
          {t('description')}
        </p>
      </div>
    </section>
  );
}
