import { useTranslations } from 'next-intl';

export default function LandingUpcycling() {
  const t = useTranslations('upcycling');

  return (
    <section
      className="upcycling-strip mb-12"
      aria-labelledby="upcycling-heading"
    >
      <p className="upcycling-banner">{t('banner')}</p>
      <div className="upcycling-rule">
        <span className="upcycling-scissors" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M8 4l12 16M16 4L4 20"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle
              cx="6"
              cy="18"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle
              cx="18"
              cy="18"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </span>
      </div>
      <div className="upcycling-inner">
        <div>
          <p className="upcycling-kicker">{t('kicker')}</p>
          <h3 id="upcycling-heading">{t('title')}</h3>
          <p>{t('body')}</p>
          <small>RETEX</small>
          <small className="upcycling-made">{t('made')}</small>
        </div>
        <div className="upcycling-stat">
          <div className="upcycling-stat-numbers">
            <span className="upcycling-hundred">100</span>
            <span className="upcycling-percent">%</span>
          </div>
          <span className="upcycling-sust">{t('sustainable')}</span>
          <div className="care-icons" aria-hidden>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect
                x="5"
                y="6"
                width="14"
                height="12"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8 10h8M8 14h5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <text
                x="12"
                y="16.5"
                textAnchor="middle"
                fontSize="6"
                fontWeight="700"
                fill="currentColor"
              >
                40°
              </text>
            </svg>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M12 4l8 14H4L12 4z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M12 9v5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect
                x="6"
                y="7"
                width="12"
                height="11"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="12"
                cy="12.5"
                r="3"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M7.5 7.5l9 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M8 6h8l2 4v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10l2-4z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M8 14h8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="19" r="1.2" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <circle
                cx="12"
                cy="12"
                r="7"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M9 9l6 6M15 9l-6 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
