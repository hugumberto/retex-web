const values = [
  {
    icon: '/assets/new-layout/values/fi-rs-truck-side.svg',
    title: 'Recolha Sustentável',
    text: 'Em Portugal, são mais de 200 mil. O problema cresce, mas temos solução.',
  },
  {
    icon: '/assets/new-layout/values/fi-rs-hand-holding-heart.svg',
    title: 'Redução do Desperdício Têxtil',
    text: 'Damos nova vida a cada peça, evitando que toneladas acabem em aterros.',
  },
  {
    icon: '/assets/new-layout/values/fi-rs-leaf.svg',
    title: 'Impacto Social e Ambiental',
    text: 'Apoiamos causas sociais e práticas sustentáveis para reduzir a pegada ecológica.',
  },
  {
    icon: '/assets/new-layout/values/fi-rr-refresh.svg',
    title: 'Economia Circular',
    text: 'Transformamos resíduos em recursos, promovendo um consumo mais consciente.',
  },
];

export default function LandingValues() {
  return (
    <section className="values-section">
      <p className="values-kicker">Descobre mais sobre</p>
      <h2>Os nossos valores</h2>
      <div className="values-grid">
        {values.map((item) => (
          <article key={item.title} className="value-card">
            <span className="value-card-icon">
              <span
                className="value-card-glyph"
                style={{
                  WebkitMaskImage: `url(${item.icon})`,
                  maskImage: `url(${item.icon})`,
                }}
              />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
