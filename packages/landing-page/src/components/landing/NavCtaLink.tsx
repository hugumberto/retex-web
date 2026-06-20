'use client';
import { useEffect, useState } from 'react';

export default function NavCtaLink() {
  const [href, setHref] = useState('/register');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('retex_session=1'));
    setHasSession(session);
    if (session) {
      const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ?? '';
      if (base) {
        setHref(`${base}/portal`);
      }
    }
  }, []);

  // Login (sessão ativa + portal) abre numa nova aba; registo abre na mesma aba.
  const isLogin = hasSession && href !== '/register';

  return (
    <a
      href={href}
      target={isLogin ? '_blank' : undefined}
      rel={isLogin ? 'noopener noreferrer' : undefined}
      className="nav-cta-btn"
    >
      Registo/Login
    </a>
  );
}
