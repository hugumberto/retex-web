import Image from 'next/image';
import Link from 'next/link';
import RegistrationForm from '@/components/landing/RegistrationForm';
import { getPortalLoginHref } from '@/lib/portal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta | RETEX',
  description: 'Cria a tua conta RETEX e começa a contribuir para um futuro mais sustentável.',
};

export default function RegisterPage() {
  const loginHref = getPortalLoginHref();
  return (
    <section className="register-hero">
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
          <Link href="/#blog">Blog</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href={loginHref} className="nav-cta-btn">
            Registo/Login
          </Link>
        </nav>
      </header>

      <Image
        src="/assets/new-layout/FUNDO_HOMEPAGE.jpg"
        alt=""
        fill
        className="landing-hero-bg object-cover"
        priority
        sizes="100vw"
      />
      <div className="landing-hero-overlay" />

      <div className="register-body">
        <RegistrationForm loginHref={loginHref} />
      </div>
    </section>
  );
}
