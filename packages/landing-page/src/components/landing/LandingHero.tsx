import Image from 'next/image';
import { getPortalLoginHref, PORTAL_LOGIN_PLACEHOLDER } from '@/lib/portal';

export default function LandingHero() {
  const loginHref = getPortalLoginHref();
  return (
    <section className="landing-hero">
      <header className="landing-header">
        <Image
          src="/assets/logo.png"
          alt="RETEX"
          width={196}
          height={53}
          className="landing-logo"
          priority
        />
        <nav className="landing-nav">
          <a href="#como-funciona">Como funciona</a>
          <a href="#servicos">Serviços</a>
          <a href="#blog">Blog</a>
          <a
            href={loginHref}
            title={loginHref === PORTAL_LOGIN_PLACEHOLDER ? 'Em breve' : undefined}
          >
            Login
          </a>
          <a href="#faq">FAQ</a>
          <a href="#formulario" className="nav-cta-btn">
            Pedir recolha
          </a>
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
      <div className="landing-hero-content">
        <h1>wear.care.share.repeat.</h1>
        <p>
          Ligamos Famílias, Empresas e Municípios numa missão:
          <br />
          prolongar o ciclo de vida da roupa usada, contribuindo para um futuro
          mais sustentável.
        </p>
      </div>
    </section>
  );
}
