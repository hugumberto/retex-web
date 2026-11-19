import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { buttonClass, Kicker, Section } from './ui';

export default function HomeUpcycling() {
  const t = useTranslations('home.upcycling');

  return (
    <Section id="upcycling" className="bg-mist pb-[50px] pt-[60px]">
      <div className="flex flex-col overflow-hidden rounded-[20px] bg-forest lg:flex-row">
        <div className="flex flex-1 flex-col items-start justify-center gap-5 px-8 py-12 text-white lg:py-14 lg:pl-14 lg:pr-10">
          <Kicker className="text-white/70">{t('kicker')}</Kicker>
          <h2 className="max-w-[340px] text-[30px] font-bold leading-[1.16] tracking-[-0.02em] sm:text-[38px]">
            {t('title')}
          </h2>
          <p className="max-w-[536px] text-[15px] leading-[26px] text-white/90">
            {t('description')}
          </p>
          <Link
            href="/?perfil=empresa#contacto"
            className={buttonClass('white')}
          >
            {t('cta')}
          </Link>
        </div>
        <div className="relative min-h-[280px] lg:w-[532px] lg:shrink-0">
          <Image
            src="/assets/landing/upcycling.jpg"
            alt={t('photoAlt')}
            fill
            sizes="(min-width: 1024px) 532px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  );
}
