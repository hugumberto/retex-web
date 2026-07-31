'use client';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import NavCtaLink from './NavCtaLink';

export const Header = () => {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="landing-header">
      <Link href="/" onClick={close}>
        <Image
          src="/assets/logo.png"
          alt={t('logoAlt')}
          width={196}
          height={53}
          className="landing-logo"
          priority
        />
      </Link>
      <button
        type="button"
        className="landing-nav-toggle"
        aria-label={t('menuAria')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={open ? 'landing-nav landing-nav--open' : 'landing-nav'}>
        <Link href="/#como-funciona" onClick={close}>
          {t('howItWorks')}
        </Link>
        <Link href="/#servicos" onClick={close}>
          {t('services')}
        </Link>
        <Link href="/blog" onClick={close}>
          {t('blog')}
        </Link>
        <Link href="/faq" onClick={close}>
          {t('faq')}
        </Link>
        <NavCtaLink />
        <LanguageSwitcher />
      </nav>
    </header>
  );
};
