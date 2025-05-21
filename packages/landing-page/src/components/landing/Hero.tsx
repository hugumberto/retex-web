import Image from 'next/image';
import { Button } from '@/components/ui/button';
export default function Hero() {
  return (
    <section className="font-family-poppins">
      <div className="relative min-w-full bg-cover bg-center text-white  bg-gradient-horizontal ">
        <div
          className="flex h-[450px]  items-center"
          style={{ backgroundImage: 'url(/assets/hero.png)' }}
        >
          <div className="max-w-6xl md:ml-32  ml-8">
            <h1 className="text-2xl md:text-5xl font-bold">
              wear.care.share.repeat
            </h1>
            <p className="mt-12 text-sm md:text-md font-bold">
              Recolhemos têxteis. Reutilizamos. Reduzimos o lixo.
            </p>
            <p className="text-sm md:text-md mt-4">
              Ligamos pessoas, empresas e municípios numa missão: dar nova vida
              à roupa usada.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row ml-[10%] w-[80%] mt-12  items-center text-primary gap-12 md:gap-28 ">
        <div className="flex flex-col max-w-64">
          <Image
            src="/assets/formulario.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto mb-4"
          />
          <h4 className="font-bold mx-auto mb-4">Preenche o formulário</h4>
          <p className="text-md ms-8 max-w-xs">
            Preenche o formulário que se encontra no{' '}
            <strong>fundo da página</strong>.
          </p>
        </div>
        <div className="flex flex-col max-w-64">
          <Image
            src="/assets/recolha.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto mb-4"
          />
          <h4 className="font-bold mx-auto mb-4">Agenda a tua recolha</h4>
          <p className="text-md ms-8 max-w-xs">
            Menciona o local e a hora mais indicado para ti.
          </p>
        </div>
        <div className="flex flex-col max-w-64">
          <Image
            src="/assets/agora_connosco.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto mb-4"
          />
          <h4 className="font-bold mx-auto mb-4">Agora é connosco</h4>
          <p className="text-md ms-8 max-w-xs">
            Espera que um dos nossos transportadores entre em contancto contigo.
          </p>
        </div>
        <div className="flex flex-col max-w-64">
          <Button className="w-52 text-md bg-gradient-horizontal p-4 pt-6 pb-6  text-white">
            Agendar Recolha
          </Button>
        </div>
      </div>
    </section>
  );
}
