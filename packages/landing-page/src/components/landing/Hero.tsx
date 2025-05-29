'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
export default function Hero() {
  return (
    <section className="font-family-poppins ">
      <div className="relative min-w-full bg-cover bg-center text-white  bg-gradient-horizontal ">
        <div
          className="flex flex-row w-full h-[450px] items-center gap-[44px] px-4
    bg-[url('/assets/hero-mobile.png')] 
    md:bg-[url('/assets/hero.png')]
    bg-cover bg-center"
        >
          <div className="max-w-6xl md:ml-20  m-4">
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
      <div className="w-full flex flex-col md:flex-row justify-center items-center  mt-12  text-primary gap-12 md:gap-28  ">
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/formulario.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Preenche o formulário
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Preenche o formulário que se encontra no{' '}
            <strong>fundo da página</strong>.
          </p>
        </div>
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/recolha.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">
            Agenda a tua recolha
          </h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Menciona o local e a hora mais indicado para ti.
          </p>
        </div>
        <div className="flex flex-col max-w-64 relative">
          <Image
            src="/assets/agora_connosco.png"
            alt="Logo"
            width={51}
            height={55}
            className="mx-auto absolute top-0 left-0 right-0"
          />
          <h4 className="font-bold mx-auto  mt-16 min-h-8">Agora é connosco</h4>
          <p className="text-md ms-8 max-w-xs md:min-h-36">
            Espera que um dos nossos transportadores entre em contacto contigo.
          </p>
        </div>
        <div className="flex flex-col max-w-64 md:min-h-44">
          <Button
            className="w-52 text-md bg-gradient-horizontal p-4 pt-6 pb-6  text-white"
            onClick={() =>
              document
                .getElementById('contact-form')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Agendar Recolha
          </Button>
        </div>
      </div>
    </section>
  );
}
