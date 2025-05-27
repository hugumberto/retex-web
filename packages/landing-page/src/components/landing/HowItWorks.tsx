'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-16 px-8 font-family-poppins md:gap-24 flex flex-col text-primary gap-12"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center  ">
        Como funciona
      </h1>
      <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row gap-12 justify-center items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary text-center md:text-justify">
            Particulares
          </h2>
          <p className="mt-4 text-md">
            Tens roupa que já não usas?{' '}
            <strong>Dá-lhe um novo propósito!</strong>
            <br />
            Se tens roupas em bom estado que já não usas, a RETEX ajuda-te a
            encaminhá-las para reutilização.
          </p>
        </div>

        <Image
          src="/assets/particulares.png"
          alt="Logo"
          width={600}
          height={510}
          className="object-cover w-2xl/2 h-auto"
        />
      </div>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
        <Image
          src="/assets/empresas.png"
          alt="Logo"
          width={600}
          height={510}
          className="object-cover w-2xl/2 h-auto"
        />
        <div>
          <h3 className="text-3xl font-bold text-primary text-center md:text-justify">
            Empresas
          </h3>
          <p className="mt-4 text-md">
            A nossa solução{' '}
            <span className="font-bold">
              permite às empresas e municípios fortalecerem a sua
              responsabilidade ambiental através de Créditos de Circularidade,
              ativos digitais{' '}
            </span>{' '}
            que refletem o impacto positivo de doações têxteis e podem ser
            usados para compensar emissões.{' '}
          </p>{' '}
          <p className="mt-4 text-md">
            Além disso, disponibilizamos{' '}
            <span className="font-bold"> dashboards ESG</span> e{' '}
            <span className="font-bold">analíticos</span> que monitorizam
            indicadores como{' '}
            <span className="font-bold">têxteis desviados de aterro e CO₂</span>{' '}
            evitado, facilitando decisões sustentáveis e baseadas em dados.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              className="mt-4 text-primary text-md border-2 border-primary hover:bg-gradient-to-r hover:from-secondary hover:to-primary hover:text-white hover:border-transparent"
              variant="outline"
              onClick={() =>
                document
                  .getElementById('contact-form')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explora as soluções
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
