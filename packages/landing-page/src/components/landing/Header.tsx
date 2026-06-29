'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import NavCtaLink from './NavCtaLink';

export const Header = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="landing-header">
      <Link href="/" onClick={close}>
        <Image
          src="/assets/logo.png"
          alt="RETEX"
          width={196}
          height={53}
          className="landing-logo"
          priority
        />
      </Link>
      <button
        type="button"
        className="landing-nav-toggle"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={open ? 'landing-nav landing-nav--open' : 'landing-nav'}>
        <Link href="/#como-funciona" onClick={close}>
          Como funciona
        </Link>
        <Link href="/#servicos" onClick={close}>
          Serviços
        </Link>
        <Link href="/blog" onClick={close}>
          Blog
        </Link>
        <Link href="/faq" onClick={close}>
          FAQ&apos;s
        </Link>
        <NavCtaLink />
      </nav>
    </header>
  );
};
