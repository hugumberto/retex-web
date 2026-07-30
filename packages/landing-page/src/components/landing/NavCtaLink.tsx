'use client';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function NavCtaLink() {
  const t = useTranslations('nav');
  const [portalHref, setPortalHref] = useState('');

  useEffect(() => {
    const session = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('retex_session=1'));
    if (!session) return;
    const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ?? '';
    if (base) setPortalHref(`${base}/portal`);
  }, []);

  // Login (sessão ativa + portal) abre numa nova aba; o registo é uma rota
  // interna e usa o Link do next-intl para manter o idioma activo.
  if (portalHref) {
    return (
      <a
        href={portalHref}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-cta-btn"
      >
        {t('cta')}
      </a>
    );
  }

  return (
    <Link href="/register" className="nav-cta-btn">
      {t('cta')}
    </Link>
  );
}
