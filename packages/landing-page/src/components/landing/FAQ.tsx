'use client';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    {
      question: 'O que é a RETEX?',
      answer:
        'A ReTex é um marketplace de economia circular, focado na recolha e valorização de têxteis e vestuário pós consumo, uma solução sustentável para o crescente desperdício de vestuário, promovendo a redução da pegada ambiental da indústria da moda e o prolongamento do ciclo de vida das roupas.',
    },
    {
      question: 'Como posso contribuir para a RETEX?',
      answer:
        'Regista-te na aplicação ReTex como Doador ou como Angariador conforme seja a tua intenção.',
    },
    {
      question: 'O que acontece às roupas recolhidas?',
      answer:
        'Após a recolha, o têxtil e vestuário passam por uma triagem automatizada com visão computacional para classificar o estado, marca e material. As peças são encaminhadas para revenda, doação ou reciclagem, através de parceiros estratégicos. Parte da roupa doada é reservada para apoio a populações em caso de catástrofes.',
    },
    {
      question: 'A RETEX só trabalha com roupa usada?',
      answer:
        'Sim, neste momento recolhemos apenas têxtil e vestuário pós consumo.',
    },
    {
      question: 'Como posso trabalhar convosco?',
      answer:
        'Regista-te na aplicação RETEX como Doador ou como Angariador conforme seja a tua intenção.De seguida, segue os passos apresentados.Se for MunicÍpio, Empresa, Investidor ou um Parceiro Estratégico, envie-nos um pedido de contacto.',
    },
  ];
  return (
    <section
      id="faq"
      className="py-16 px-8 font-family-poppins md:gap-12 flex flex-col text-primary gap-4 items-center "
    >
      <h1 className="text-3xl md:text-5xl font-bold mb-6 text-primary ">
        Perguntas frequentes
      </h1>
      <p>
        Tens dúvidas sobre a RETEX? Aqui encontras as respostas às questões mais
        comuns
      </p>
      <div className="w-full max-w-4xl mx-auto mt-8">
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="mt-4 data-[state=open]:[&_.plus]:hidden data-[state=open]:[&_.minus]:inline"
            >
              <AccordionTrigger className="border-2 border-gray-200 text-gray-500 font-medium rounded-md py-3 px-4  text-justify flex justify-between items-center w-full text-sm md:text-lg">
                <span>{faq.question}</span>
                <span className="ml-2 transition-all duration-300">
                  <Plus className="plus h-4 w-4 inline" />
                  <Minus className="minus h-4 w-4 hidden" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="rounded-md py-4 px-4 w-full font-light text-justify mt-4 bg-secondary text-white text-sm">
                <p>{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
