import Image from 'next/image';
export default function AboutUs() {
  return (
    <section
      id="about-us"
      className="py-16 px-8 font-family-poppins md:gap-24 flex flex-col text-primary gap-12"
    >
      <div className="flex flex-col md:flex-row items-center gap-12  mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
          Sobre nós
        </h1>
        <div className="text-justify gap-4 flex flex-col items-center md:items-start">
          <p className="text-sm max-w-3xl mx-auto">
            Sabias que, todos os anos, mais de 92 milhões de toneladas de
            têxteis vão parar ao lixo? Em{' '}
            <strong>
              Portugal, são mais de 200 mil toneladas descartadas como resíduos
              urbanos
            </strong>
            . O problema não para de crescer, mas nós temos uma solução.
          </p>
          <p className="text-sm max-w-3xl mx-auto">
            Apresentamos a RETEX, uma{' '}
            <strong>
              plataforma que revoluciona a forma como lidamos com o desperdício
              têxtil
            </strong>
            . Tornamos a reutilização de têxtil mais simples, conveniente e
            eficiente, através de um modelo de recolha inovador e um compromisso
            real com a economia circular.
          </p>
          <p className="text-sm max-w-3xl mx-auto">
            Conectamos consumidores, empresas e municípios para dar nova vida
            aos têxteis, reduzir o desperdício e gerar impacto ambiental e
            social positivo.
          </p>
        </div>
      </div>
      <div className="w-full flex flex-col md:flex-row justify-center items-center  mt-12   text-primary gap-12 md:gap-28  ">
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/sustentavel.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Recolha Sustentável
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Sabias que mais de 92 milhões de toneladas de têxteis vão parar ao
            lixo todos os anos? Em Portugal, são mais de 200 mil. O problema
            cresce, mas temos solução.
          </p>
        </div>
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/reducao_desperdicio.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Redução do Desperdício Têxtil
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Damos nova vida a cada peça, evitando que toneladas acabem em
            aterros.
          </p>
        </div>
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/ambiente.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Impacto Social e Ambiental
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Apoiamos causas sociais e práticas sustentáveis para reduzir a
            pegada ecológica.
          </p>
        </div>
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/economia_circular.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Economia Circular
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Transformamos resíduos em recursos, promovendo um consumo mais
            consciente.
          </p>
        </div>
      </div>
    </section>
  );
}
