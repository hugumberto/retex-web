'use client';
import Image from 'next/image';
import Link from 'next/link';
import NavCtaLink from './NavCtaLink';

export const Header = () => {
  return (
    <header className="landing-header">
      <Link href="/">
        <Image
          src="/assets/logo.png"
          alt="RETEX"
          width={196}
          height={53}
          className="landing-logo"
          priority
        />
      </Link>
      <nav className="landing-nav">
        <Link href="/#como-funciona">Como funciona</Link>
        <Link href="/#servicos">Serviços</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/faq">FAQ&apos;s</Link>
        <NavCtaLink />
      </nav>
    </header>
  );
};
