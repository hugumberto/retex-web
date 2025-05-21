import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative bg-cover bg-center text-white  bg-gradient-horizontal  font-family-poppins">
      <div
        className="flex h-[900px]  items-center"
        style={{ backgroundImage: "url(/assets/hero.png)" }}
      >
        <div className="max-w-6xl md:ml-32  ml-16">
          <h1 className="text-2xl md:text-5xl font-bold">
            O que fazes com a roupa que já não usas?
            <br />
            Nós damos-lhe um novo propósito!
          </h1>
          <p className="mt-16 text-md">
            <strong>Particular?</strong> Dá um novo destino às tuas roupas.
            <br />
            <strong>Tens uma empresa?</strong> Torna a tua produção mais
            sustentável.
          </p>
          <Button className="mt-6 text-md bg-transparent border-2 p-4 pt-5 pb-5 ">
            Descobre mais
          </Button>
        </div>
      </div>
    </section>
  );
}
