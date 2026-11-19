import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { buttonClass, CheckList, Section } from './ui';

type Profile = 'individuals' | 'businesses' | 'municipalities';

const PROFILES: {
  key: Profile;
  href: string;
  card: string;
  tone: 'dark' | 'light';
}[] = [
  {
    key: 'individuals',
    href: '/register',
    card: 'border border-line-soft bg-white',
    tone: 'dark',
  },
  {
    key: 'businesses',
    href: '/?perfil=empresa#contacto',
    card: 'bg-teal',
    tone: 'light',
  },
  {
    key: 'municipalities',
    href: '/?perfil=municipio#contacto',
    card: 'bg-forest',
    tone: 'light',
  },
];

export default function HomeProfiles() {
  const t = useTranslations('home.profiles');

  return (
    <Section id="perfis" className="bg-mist py-20 lg:py-[100px]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="max-w-[442px] text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[44px]">
          {t('title')}
        </h2>
        <p className="max-w-[420px] text-[15px] leading-[26px] text-ink">
          {t('description')}
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PROFILES.map(({ key, href, card, tone }) => {
          const light = tone === 'light';
          return (
            <article
              key={key}
              className={cn(
                'flex min-h-[460px] flex-col justify-between gap-10 rounded-[20px] px-8 pb-8 pt-9 lg:min-h-[524px]',
                card
              )}
            >
              <div className="flex flex-col gap-4">
                <p
                  className={cn(
                    'font-mono text-[10px] uppercase tracking-[0.1em]',
                    light ? 'text-white/70' : 'text-teal'
                  )}
                >
                  {t(`${key}.kicker`)}
                </p>
                <h3
                  className={cn(
                    'text-2xl font-bold leading-8 tracking-[-0.01em]',
                    light ? 'text-white' : 'text-navy'
                  )}
                >
                  {t(`${key}.title`)}
                </h3>
                <p
                  className={cn(
                    'text-sm leading-[26px]',
                    light ? 'text-white/85' : 'text-ink'
                  )}
                >
                  {t(`${key}.description`)}
                </p>
                <CheckList
                  tone={tone}
                  items={[0, 1, 2].map((i) => t(`${key}.items.${i}`))}
                />
              </div>
              <Link
                href={href}
                className={cn(
                  'self-start',
                  buttonClass(light ? 'outline-white' : 'primary')
                )}
              >
                {t(`${key}.cta`)}
              </Link>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
