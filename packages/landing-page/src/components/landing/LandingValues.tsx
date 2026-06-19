import Image from 'next/image';

const values = [
  {
    icon: '/assets/new-layout/1.svg',
    w: 34,
    h: 28,
    title: 'Recolha Sustentável',
    text: 'Em Portugal, são mais de 200 mil. O problema cresce, mas temos solução.',
  },
  {
    icon: '/assets/new-layout/2.svg',
    w: 36,
    h: 30,
    title: 'Redução do Desperdício Têxtil',
    text: 'Damos nova vida a cada peça, evitando que toneladas acabem em aterros.',
  },
  {
    icon: '/assets/new-layout/4.svg',
    w: 34,
    h: 30,
    title: 'Impacto Social e Ambiental',
    text: 'Apoiamos causas sociais e práticas sustentáveis para reduzir a pegada ecológica.',
  },
  {
    icon: '/assets/new-layout/5.svg',
    w: 36,
    h: 24,
    title: 'Economia Circular',
    text: 'Transformamos resíduos em recursos, promovendo um consumo mais consciente.',
  },
];

export default function LandingValues() {
  return (
    <section className="values-section">
      <p className="values-kicker">Estes são os</p>
      <h2>Nossos valores</h2>
      <div className="values-grid">
        {values.map((item) => (
          <article key={item.title} className="value-card">
            <span className="value-card-icon">
              <Image src={item.icon} alt="" width={item.w} height={item.h} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
