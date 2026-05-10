import Script from 'next/script';
import './global.css';

export const metadata = {
  title:
    'RETEX | Soluções Sustentáveis para a Recolha e Reutilização de Têxteis',
  description:
    'Transforma o teu impacto ambiental com a RETEX. Recolhe, reutiliza e contribui para um futuro mais sustentável. Começa agora.',
  keywords: [
    'desperdício têxtil',
    'roupa usada',
    'economia circular',
    'marketplace sustentável',
    'triagem automática de roupa',
    'reutilização têxtil',
    'reciclagem de têxteis',
    'RETEX',
    'impacto ambiental',
  ],
  openGraph: {
    title: 'RETEX - Moda Sustentável e Circular',
    description:
      'Transforme o futuro da moda com a RETEX. Reutilize, recicle e reduza o impacto ambiental.',
    url: 'https://retex.pt',
    siteName: 'RETEX',
    images: [
      {
        url: 'https://retex.pt/logo_circular.jpg', // 👈 imagem hospedada
        width: 1200,
        height: 630,
        alt: 'RETEX - Economia Circular para a Moda',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-X2G04J7NPJ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X2G04J7NPJ');
          `}
      </Script>
      <body>{children}</body>
    </html>
  );
}
