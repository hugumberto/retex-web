import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-16 px-4 font-family-poppins gap-24 flex flex-col text-primary "
    >
      <h1 className="text-5xl font-bold text-center mb-12 ">Como funciona</h1>
      <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row gap-12 justify-center items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary">Particulares</h2>
          <p className="mt-4 text-md">
            Tens roupa que já não usas?{' '}
            <strong>Dá-lhe um novo propósito!</strong>
            <br />
            Se tens roupas em bom estado que já não usas, a RETEX ajuda-te a
            encaminhá-las para reutilização.
          </p>
          <Button
            className="mt-4 text-primary text-md  border-2 border-primary hover:bg-gradient-to-r hover:from-secondary hover:to-primary hover:text-white hover:border-transparent"
            variant="outline"
          >
            Sabe como doar
          </Button>
        </div>

        <Image
          src="/assets/particulares.png"
          alt="Logo"
          width={600}
          height={510}
          className="object-cover a"
        />
      </div>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
        <Image
          src="/assets/empresas.png"
          alt="Logo"
          width={600}
          height={510}
          className="object-cover a"
        />
        <div>
          <h3 className="text-3xl font-bold text-primary">Empresas</h3>
          <p className="mt-4 text-md">
            A nossa solução{' '}
            <span className="font-bold">
              permite às empresas e municípios fortalecerem a sua
              responsabilidade ambiental através de Créditos de Circularidade,
              ativos digitais{' '}
            </span>{' '}
            que refletem o impacto positivo de doações têxteis e podem ser
            usados para compensar emissões. Além disso, disponibilizamos{' '}
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
            >
              Explora as soluções
            </Button>
            <a className="mt-5 text-primary text-md underline bold" href="">
              Descarregar pdf*
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
