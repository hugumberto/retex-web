'use client';

import { Link } from '@/i18n/navigation';
import { getPortalLoginHref } from '@/lib/portal';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '../landing/LanguageSwitcher';
import { buttonClass } from './ui';

// Com sessão ativa no portal, "Agendar recolha" leva direto ao portal em vez
// do registo (o mesmo critério do NavCtaLink antigo).
function usePortalHref() {
  const [href, setHref] = useState('');
  useEffect(() => {
    const session = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('retex_session=1'));
    const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ?? '';
    if (session && base) setHref(`${base.replace(/\/$/, '')}/portal`);
  }, []);
  return href;
}

export default function SiteHeader() {
  const t = useTranslations('home.nav');
  const [open, setOpen] = useState(false);
  const portalHref = usePortalHref();
  const close = () => setOpen(false);

  const links = [
    { href: '/#como-funciona', label: t('howItWorks') },
    { href: '/#perfis', label: t('businesses') },
    { href: '/#percurso', label: t('journey') },
    { href: '/faq', label: t('faq') },
    { href: '/blog', label: t('blog') },
  ] as const;

  const cta = portalHref ? (
    <a href={portalHref} className={buttonClass('primary')}>
      {t('cta')}
    </a>
  ) : (
    <Link href="/register" className={buttonClass('primary')} onClick={close}>
      {t('cta')}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-mist/95 px-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex h-[73px] w-full max-w-[1164px] items-center justify-between gap-6">
        <Link href="/" onClick={close} aria-label={t('home')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/landing/logo-navy.svg"
            alt="ReTeX:ID"
            width={133}
            height={24}
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-navy lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-teal">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 text-sm font-medium text-navy lg:flex">
          <LanguageSwitcher variant="compact" />
          <a href={getPortalLoginHref()} className="hover:text-teal">
            {t('login')}
          </a>
          {cta}
        </div>

        <button
          type="button"
          className="text-navy lg:hidden"
          aria-label={t('menu')}
          aria-expanded={open}
          aria-controls="menu-movel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        id="menu-movel"
        className={cn(
          'mx-auto max-w-[1164px] flex-col gap-4 pb-6 text-base font-medium text-navy lg:hidden',
          open ? 'flex' : 'hidden'
        )}
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={close}>
            {link.label}
          </Link>
        ))}
        <a href={getPortalLoginHref()}>{t('login')}</a>
        <div className="flex items-center justify-between gap-4 pt-2">
          <LanguageSwitcher variant="compact" />
          {cta}
        </div>
      </div>
    </header>
  );
}
