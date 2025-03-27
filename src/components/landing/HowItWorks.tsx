import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-xl font-bold">Particulares</h3>
          <p className="mt-2 text-sm">
            Tens roupa que já não usas?{" "}
            <strong>Dá-lhe um novo propósito!</strong>
            <br />
            Se tens roupas em bom estado que já não usas, a RETEX ajuda-te a
            encaminhá-las para reutilização.
          </p>
          <Button className="mt-4" variant="outline">
            Sabe como doar
          </Button>
        </div>
        <div>
          <h3 className="text-xl font-bold">Empresas</h3>
          <p className="mt-2 text-sm">
            Tens materiais têxteis para reaproveitar? A RETEX oferece uma
            solução sustentável para empresas.
          </p>
          <Button className="mt-4" variant="outline">
            Explora as soluções para empresas
          </Button>
        </div>
      </div>
    </section>
  );
}
