import { Header } from '@/components/landing/Header';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  BarChart3,
  CalendarDays,
  Check,
  Coins,
  FileText,
  Leaf,
  PiggyBank,
  Settings,
} from 'lucide-react';

// Dados oficiais do projeto. Ficam no código (e não nas mensagens i18n) porque
// são valores contratuais — não se traduzem nem se reformulam por idioma.
const PROJECT_NUMBER = '23720';
const ELIGIBLE_INVESTMENT = '30.000 €';
const FINANCIAL_SUPPORT = '30.000 €';

const factIcons = {
  number: FileText,
  investment: Coins,
  support: PiggyBank,
  program: CalendarDays,
} as const;

const objectiveIcons = {
  platform: Leaf,
  components: Settings,
  impact: BarChart3,
} as const;

const objectives = ['platform', 'components', 'impact'] as const;
const results = ['sorting', 'transparency', 'climate'] as const;

export default function LandingPrrProject() {
  const t = useTranslations('prr');

  return (
    <>
      <section className="prr-hero">
        <Header />
        <Image
          src="/assets/new-layout/PARTICULARES.jpeg"
          alt=""
          fill
          className="prr-hero-bg object-cover"
          priority
          sizes="100vw"
        />
        <div className="prr-hero-overlay" />
        <div className="prr-hero-content">
          <p className="prr-hero-kicker">{t('hero.kicker')}</p>
          <h1>{t('hero.title')}</h1>
          <p className="prr-hero-subtitle">{t('hero.subtitle')}</p>
          <p className="prr-hero-lead">{t('hero.lead')}</p>
        </div>
      </section>

      <div className="prr-page">
        <section className="prr-about">
          <div className="prr-about-text">
            <h2>{t('about.title')}</h2>
            <p>
              {t('about.body1', {
                number: PROJECT_NUMBER,
              })}
            </p>
            <p>{t.rich('about.body2', { strong: (c) => <strong>{c}</strong> })}</p>
          </div>

          <aside className="prr-facts" aria-label={t('facts.ariaLabel')}>
            {(
              [
                ['number', PROJECT_NUMBER],
                ['investment', ELIGIBLE_INVESTMENT],
                ['support', FINANCIAL_SUPPORT],
                ['program', t('facts.program.value')],
              ] as const
            ).map(([key, value]) => {
              const Icon = factIcons[key];
              return (
                <div key={key} className="prr-fact">
                  <span className="prr-fact-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="prr-fact-label">{t(`facts.${key}.label`)}</p>
                    <p className="prr-fact-value">{value}</p>
                  </div>
                </div>
              );
            })}
          </aside>
        </section>

        <section className="prr-columns">
          <div>
            <h2>{t('objectives.title')}</h2>
            <div className="prr-objectives">
              {objectives.map((key) => {
                const Icon = objectiveIcons[key];
                return (
                  <article key={key} className="prr-objective">
                    <span className="prr-objective-icon" aria-hidden="true">
                      <Icon size={30} strokeWidth={1.4} />
                    </span>
                    <p>
                      {t.rich(`objectives.items.${key}`, {
                        strong: (c) => <strong>{c}</strong>,
                      })}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div>
            <h2>{t('results.title')}</h2>
            <ul className="prr-results">
              {results.map((key) => (
                <li key={key}>
                  <span className="prr-result-check" aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{t(`results.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="prr-funding">
          <h2>{t('funding.title')}</h2>
          <p>{t('funding.body')}</p>
          <div className="prr-funding-bar">
            <Image
              src="/assets/prr/barra-financiamento.webp"
              alt={t('funding.barAlt')}
              width={1841}
              height={175}
              sizes="(max-width: 720px) 100vw, 720px"
            />
          </div>
        </section>

        <section className="prr-cta">
          <p className="prr-cta-text">
            <span className="prr-cta-icon" aria-hidden="true">
              <Leaf size={22} strokeWidth={1.6} />
            </span>
            {t('cta.text')}
          </p>
          <Link href="/" className="prr-cta-btn">
            {t('cta.button')} <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
