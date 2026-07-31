import { useTranslations } from 'next-intl';

const steps = [
  {
    key: 'register',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
        <path
          d="M9 6h14a2 2 0 012 2v18l-4-3H9a2 2 0 01-2-2V8a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M11 12h10M11 16h7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'schedule',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
        <rect
          x="7"
          y="9"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M7 14h18M11 6v4M21 6v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'rest',
    icon: (
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
        <path
          d="M6 18h3l2-6 4 12 3-10h8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 22l4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export default function LandingHowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section id="como-funciona" className="landing-section">
      <h2>{t('title')}</h2>
      <div className="icon-cards">
        {steps.map((item, index) => (
          <article key={item.key} className="icon-card">
            <span className="step-badge">{index + 1}</span>
            <span className="icon-card-line-icon">{item.icon}</span>
            <h3>{t(`steps.${item.key}.title`)}</h3>
            <p>{t(`steps.${item.key}.description`)}</p>
          </article>
        ))}
      </div>
      {/* <h2 className="section-title-alt section-heading-spaced">Até agora...</h2>
      <div className="stats-bar" role="list">
        <div className="stat-item" role="listitem">
          <span className="stat-icon" aria-hidden>
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <path
                d="M8 10h16v14H8V10zm2-4h12v4H10V6zm4 8h4v6h-4v-6z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="stat-copy">
            <strong>24+</strong>
            <span>Toneladas desperdiçadas</span>
          </div>
        </div>
        <div className="stat-item" role="listitem">
          <span className="stat-icon" aria-hidden>
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <path
                d="M6 14L16 6l10 8v12H6V14z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M12 26v-8h8v8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="stat-copy">
            <strong>24</strong>
            <span>Municípios parceiros</span>
          </div>
        </div>
        <div className="stat-item" role="listitem">
          <span className="stat-icon" aria-hidden>
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <path
                d="M10 10a9 9 0 0114-2M22 22a9 9 0 01-14 2M6 20l2-6 6 2M26 12l-2 6-6-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 9v4l3 2M16 23v-4l-3-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="stat-copy">
            <strong>000</strong>
            <span>Peças em circuito fechado</span>
          </div>
        </div>
      </div> */}
    </section>
  );
}
