'use client';
import { useEffect, useState } from 'react';

export default function NavCtaLink() {
  const [href, setHref] = useState('/register');

  useEffect(() => {
    const hasSession = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('retex_session=1'));
    if (hasSession) {
      const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ?? '';
      setHref(base ? `${base}/portal` : '/register');
    }
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="nav-cta-btn"
    >
      Registo/Login
    </a>
  );
}
