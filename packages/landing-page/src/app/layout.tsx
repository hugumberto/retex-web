import './global.css';

export const metadata = {
  title:
    'RETEX | Soluções Sustentáveis para a Recolha e Reutilização de Têxteis',
  description:
    'Transforma o teu impacto ambiental com a RETEX. Recolhe, reutiliza e contribui para um futuro mais sustentável. Começa agora.',
};
/*Meta Keywords
1. desperdício textil, roupa usada, economia circular, marketplace sustentável, triagem automática de roupa, reutilização têxtil, reciclagem de têxteis, RETEX, impacto ambiental */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
