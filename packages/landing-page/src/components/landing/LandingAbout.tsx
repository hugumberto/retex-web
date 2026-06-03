import Image from 'next/image';

export default function LandingAbout() {
  return (
    <section id="sobre-nos" className="who-section">
      <div className="who-logo">
        <Image
          src="/assets/new-layout/RETEX_LOGO.jpg"
          alt="RETEX"
          width={260}
          height={100}
        />
      </div>
      <div className="who-text">
        <h2>Quem somos?</h2>
        <p>
          Apresentamos a RETEX, uma{' '}
          <strong>
            plataforma que revoluciona a forma como lidamos com o desperdício
            têxtil
          </strong>
          . Tornamos a reutilização de têxtil mais simples, conveniente e
          eficiente, através de um modelo de recolha inovador e um compromisso
          real com a economia circular.
        </p>
        <p>
          Conectamos consumidores, empresas e municípios para dar nova vida aos
          têxteis, reduzir o desperdício e gerar impacto ambiental e social
          positivo.
        </p>
        <button type="button" className="who-cta-btn">
          Saber mais
        </button>
      </div>
    </section>
  );
}
