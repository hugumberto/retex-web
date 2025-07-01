'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { JSX, ReactElement } from 'react';
export default function Hero() {
  type ItemContainerProps = {
    path: string;
    title: string;
    children: JSX.Element;
  };

  const ItemContainer: React.FC<ItemContainerProps> = ({
    path,
    title,
    children,
  }) => (
    <div className="flex flex-col max-w-64 relative">
      <Image
        src={path}
        alt="Logo"
        width={51}
        height={55}
        className="mx-auto absolute top-0 left-0 right-0"
      />
      <h4 className="font-bold mx-auto  mt-16 min-h-8">{title}</h4>
      <p className="text-md ms-8 max-w-xs md:min-h-36">{children}</p>
    </div>
  );

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
            <h1 className="text-[32px] md:text-[48px] md:text-5xl font-bold">
              wear.care.share.repeat.
            </h1>
            <p className="text-[16px] md:text-[18px mt-4">
              Ligamos Familias, Empresas e Municípios numa missão: prolongar o
              ciclo de vida da roupa usada, contribuindo para um futuro mais
              sustentável.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col md:flex-row justify-center items-center  mt-12  text-primary gap-12 md:gap-28  ">
        {[
          {
            path: '/assets/formulario.png',
            title: 'Preenche o formulário',
            children: (
              <span>
                Basta seguir até ao final da página e submeter os dados.
              </span>
            ) as ReactElement,
          },
          {
            path: '/assets/recolha.png',
            title: 'Agenda a tua recolha',
            children: (
              <span>Menciona o local e a hora mais indicado para ti.</span>
            ) as ReactElement,
          },
          {
            path: '/assets/agora_connosco.png',
            title: 'Agora é connosco',
            children: (
              <span>
                Aguarda que um dos nossos transportadores entre em contacto
                contigo.
              </span>
            ) as ReactElement,
          },
        ].map((item, index) => (
          <ItemContainer key={index} path={item.path} title={item.title}>
            {item.children}
          </ItemContainer>
        ))}

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
