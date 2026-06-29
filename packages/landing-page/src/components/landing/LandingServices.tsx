import Image from 'next/image';
import Link from 'next/link';

export default function LandingServices() {
  return (
    <section id="servicos" className="landing-grid-two">
      <article className="split-card split-text split-text--empresas">
        <h3>Empresas e Municípios</h3>
        <p>
          A nossa solução permite a municípios e empresas reforçarem a gestão
          sustentável dos têxteis através de um sistema de recolha seletiva e
          economia circular. Os municípios beneficiam de maior desvio de
          resíduos têxteis de aterro, melhoria das taxas de reciclagem e acesso
          a dados de impacto ambiental através de dashboards digitais. As
          empresas, por sua vez, podem obter Créditos de Circularidade
          associados à recolha e valorização de têxteis, apoiando a compensação
          de emissões e o reporte de indicadores ESG de forma mais transparente
          e mensurável.
        </p>
        <a href="#formulario" className="primary-pill">
          Entrar em contacto
        </a>
      </article>
      <article className="split-card split-image-only">
        <Image
          src="/assets/new-layout/EMPRESAS.jpg"
          alt="Têxteis e símbolo de reciclagem"
          width={1019}
          height={910}
          className="split-image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </article>
      <article className="split-card split-image-only">
        <Image
          src="/assets/new-layout/PARTICULARES.jpeg"
          alt="Costura e reutilização têxtil"
          width={1073}
          height={679}
          className="split-image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </article>
      <article className="split-card split-text split-text--particular">
        <h3>Particulares</h3>
        <p>
          Tem roupa que já não usa? Dê-lhe um novo propósito. Através do serviço
          de recolha seletiva de têxteis, a RETEX encaminha peças em bom estado
          para reutilização, contribuindo para a redução de resíduos e para a
          promoção da economia circular.
        </p>
        <Link href="/register" className="landing-outline-btn">
          Agendar recolha
        </Link>
      </article>
    </section>
  );
}
