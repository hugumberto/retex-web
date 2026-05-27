import Image from 'next/image';

export default function LandingServices() {
  return (
    <section id="servicos" className="landing-grid-two">
      <article className="split-card split-text split-text--empresas">
        <h3>Empresas e Municípios</h3>
        <p>
          A nossa solução permite às empresas e municípios fortalecerem a sua
          responsabilidade ambiental através de Créditos de Circularidade, ativos
          digitais que refletem o impacto positivo de doações têxteis e podem ser
          usados para compensar emissões, com visibilidade para os teus
          indicadores ESG e dashboards de impacto.
        </p>
        <button type="button" className="primary-pill">
          Entrar em contacto
        </button>
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
          src="/assets/new-layout/PARTICULARES.jpg"
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
          Tens roupa que já não usas? Dá-lhe um novo propósito! Se tens roupas em
          bom estado que já não usas, a RETEX ajuda-te a encaminhá-las para
          reutilização.
        </p>
        <button type="button" className="landing-outline-btn">
          Agendar recolha
        </button>
      </article>
    </section>
  );
}
