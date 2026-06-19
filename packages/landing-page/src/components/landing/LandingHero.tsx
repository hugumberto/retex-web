import { Header } from '@/components/landing/Header';
import Image from 'next/image';

export default function LandingHero() {
  return (
    <section className="landing-hero">
      <Header />
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
