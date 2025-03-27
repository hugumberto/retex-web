import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section
      className="relative bg-cover bg-center text-white py-20 px-4"
      style={{ backgroundImage: "url(/assets/hero.png)" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl md:text-4xl font-bold">
          O que fazes com a roupa que já não usas?
        </h1>
        <p className="mt-4 text-lg">
          Nós damos-lhe{" "}
          <span className="underline font-semibold">um novo propósito!</span>
        </p>
        <p className="mt-4 text-sm">
          <strong>Particular?</strong> Dá um novo destino às tuas roupas.
          <br />
          <strong>Tens uma empresa?</strong> Torna a tua produção mais
          sustentável.
        </p>
        <Button className="mt-6">Descobre mais</Button>
      </div>
    </section>
  );
}
