import { Card, CardContent } from "@/components/ui/card";

export default function FAQ() {
  return (
    <section className="py-16 px-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        Perguntas frequentes
      </h2>
      <div className="max-w-md mx-auto space-y-2">
        {[
          "O que é a RETEX?",
          "Como posso contribuir para a RETEX?",
          "O que acontece às roupas recolhidas?",
          "A RETEX só trabalha com roupa usada?",
          "Como posso trabalhar convosco?"
        ].map((q, i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-sm">{q}</span>
              <span>&rarr;</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
