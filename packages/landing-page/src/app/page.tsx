import Image from 'next/image';
import ContactForm from '@/components/landing/ContactForm';

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="landing-page">
        <section className="landing-hero">
          <header className="landing-header">
            <Image
              src="/assets/logo.png"
              alt="RETEX"
              width={196}
              height={53}
              className="landing-logo"
              priority
            />
            <nav className="landing-nav">
              <a href="#como-funciona">Como funciona</a>
              <a href="#servicos">Serviços</a>
              <a href="#blog">Blog</a>
              <a href="#login">Login</a>
              <a href="#faq">FAQ</a>
              <a href="#formulario" className="nav-cta-btn">
                Pedir recolha
              </a>
            </nav>
          </header>
          <Image
            src="/assets/new-layout/FUNDO_HOMEPAGE.jpg"
            alt=""
            fill
            className="landing-hero-bg object-cover"
            priority
            sizes="100vw"
          />
          <div className="landing-hero-overlay" />
          <div className="landing-hero-content">
            <h1>wear.care.share.repeat.</h1>
            <p>
              Ligamos Famílias, Empresas e Municípios numa missão:
              <br />
              prolongar o ciclo de vida da roupa usada, contribuindo para um
              futuro mais sustentável.
            </p>
          </div>
        </section>

        <section id="como-funciona" className="landing-section">
          <h2>Como funciona?</h2>
          <div className="icon-cards">
            {[
              {
                title: 'Preenche o formulário',
                description: 'Basta seguir até ao final da página e submeter os dados.',
                icon: (
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                    <path
                      d="M9 6h14a2 2 0 012 2v18l-4-3H9a2 2 0 01-2-2V8a2 2 0 012-2z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11 12h10M11 16h7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                title: 'Agenda a tua recolha',
                description: 'Menciona o local e a hora mais indicado para ti.',
                icon: (
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                    <rect
                      x="7"
                      y="9"
                      width="18"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M7 14h18M11 6v4M21 6v4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                title: 'Agora é connosco',
                description: 'Aguarda que um dos nossos transportadores entre em contacto contigo.',
                icon: (
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                    <path
                      d="M6 18h3l2-6 4 12 3-10h8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 22l4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <article key={item.title} className="icon-card">
                <span className="step-badge">{index + 1}</span>
                <span className="icon-card-line-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <h2 className="section-title-alt section-heading-spaced">Até agora...</h2>
          <div className="stats-bar" role="list">
            <div className="stat-item" role="listitem">
              <span className="stat-icon" aria-hidden>
                <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
                  <path
                    d="M8 10h16v14H8V10zm2-4h12v4H10V6zm4 8h4v6h-4v-6z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="stat-copy">
                <strong>24+</strong>
                <span>Toneladas desperdiçadas</span>
              </div>
            </div>
            <div className="stat-item" role="listitem">
              <span className="stat-icon" aria-hidden>
                <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
                  <path
                    d="M6 14L16 6l10 8v12H6V14z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 26v-8h8v8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="stat-copy">
                <strong>24</strong>
                <span>Municípios parceiros</span>
              </div>
            </div>
            <div className="stat-item" role="listitem">
              <span className="stat-icon" aria-hidden>
                <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
                  <path
                    d="M10 10a9 9 0 0114-2M22 22a9 9 0 01-14 2M6 20l2-6 6 2M26 12l-2 6-6-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 9v4l3 2M16 23v-4l-3-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="stat-copy">
                <strong>000</strong>
                <span>Peças em circuito fechado</span>
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="landing-grid-two">
          <article className="split-card split-text split-text--empresas">
            <h3>Empresas e Municípios</h3>
            <p>
              A nossa solução permite às empresas e municípios fortalecerem a
              sua responsabilidade ambiental através de Créditos de
              Circularidade, ativos digitais que refletem o impacto positivo de
              doações têxteis e podem ser usados para compensar emissões, com
              visibilidade para os teus indicadores ESG e dashboards de impacto.
            </p>
            <button type="button" className="primary-pill">
              Entrar em contacto
            </button>
          </article>
          <article className="split-card split-image-only">
            <Image
              src="/assets/new-layout/EMPRESAS.jpg"
              alt="Têxteis e símbolo de reciclagem"
              width={1019}
              height={910}
              className="split-image"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </article>
          <article className="split-card split-image-only">
            <Image
              src="/assets/new-layout/PARTICULARES.jpg"
              alt="Costura e reutilização têxtil"
              width={1073}
              height={679}
              className="split-image"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </article>
          <article className="split-card split-text split-text--particular">
            <h3>Particulares</h3>
            <p>
              Tens roupa que já não usas? Dá-lhe um novo propósito! Se tens
              roupas em bom estado que já não usas, a RETEX ajuda-te a
              encaminhá-las para reutilização.
            </p>
            <button type="button" className="landing-outline-btn">
              Agendar recolha
            </button>
          </article>
        </section>

        <section id="sobre-nos" className="who-section">
          <div className="who-logo">
            <Image
              src="/assets/new-layout/RETEX_LOGO.jpg"
              alt="RETEX"
              width={260}
              height={100}
            />
          </div>
          <div className="who-text">
            <h2>Quem somos?</h2>
            <p>
              Apresentamos a RETEX, uma{' '}
              <strong>
                plataforma que revoluciona a forma como lidamos com o
                desperdício têxtil
              </strong>
              . Tornamos a reutilização de têxtil mais simples, conveniente e
              eficiente, através de um modelo de recolha inovador e um
              compromisso real com a economia circular.
            </p>
            <p>
              Conectamos consumidores, empresas e municípios para dar nova vida
              aos têxteis, reduzir o desperdício e gerar impacto ambiental e
              social positivo.
            </p>
            <button type="button" className="who-cta-btn">
              Saber mais
            </button>
          </div>
        </section>

        <section className="values-section">
          <p className="values-kicker">Estes são os</p>
          <h2>Nossos valores</h2>
          <div className="values-grid">
            {[
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
            ].map((item) => (
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

        <section className="quote-section" aria-labelledby="quote-heading">
          <span className="quote-watermark quote-watermark--left" aria-hidden>
            ♻
          </span>
          <span className="quote-watermark quote-watermark--right" aria-hidden>
            ♻
          </span>
          <p className="quote-mark">“</p>
          <blockquote className="quote-body" id="quote-heading">
            Reciclar é reconhecer que tudo tem valor e merece uma segunda vida.
          </blockquote>
          <p className="quote-author">- Jane Goodall</p>
        </section>

        <section className="upcycling-strip" aria-labelledby="upcycling-heading">
          <p className="upcycling-banner">
            ESTA PEÇA FOI REINVENTADA COM MATERIAIS REUTILIZADOS
          </p>
          <div className="upcycling-rule">
            <span className="upcycling-scissors" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path
                  d="M8 4l12 16M16 4L4 20"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
          </div>
          <div className="upcycling-inner">
            <div>
              <p className="upcycling-kicker">UPCYCLING TÊXTIL</p>
              <h3 id="upcycling-heading">Dar uma nova vida ao material</h3>
              <p>
                Na RETEX, o upcycling é a forma mais criativa de prolongar a vida
                dos têxteis. Em vez de irem para o lixo, resíduos de produção,
                stock excedente e uniformes antigos são transformados em novos
                produtos com mais valor — acessórios, peças para o lar e brindes
                corporativos.
              </p>
              <small>RETEX</small>
              <small className="upcycling-made">Made in Portugal</small>
            </div>
            <div className="upcycling-stat">
              <div className="upcycling-stat-numbers">
                <span className="upcycling-hundred">100</span>
                <span className="upcycling-percent">%</span>
              </div>
              <span className="upcycling-sust">Sustentável</span>
              <div className="care-icons" aria-hidden>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <rect
                    x="5"
                    y="6"
                    width="14"
                    height="12"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M8 10h8M8 14h5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <text
                    x="12"
                    y="16.5"
                    textAnchor="middle"
                    fontSize="6"
                    fontWeight="700"
                    fill="currentColor"
                  >
                    40°
                  </text>
                </svg>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <path
                    d="M12 4l8 14H4L12 4z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 9v5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <rect
                    x="6"
                    y="7"
                    width="12"
                    height="11"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M7.5 7.5l9 10"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <path
                    d="M8 6h8l2 4v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10l2-4z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 14h8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="19" r="1.2" fill="currentColor" />
                </svg>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M9 9l6 6M15 9l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="partners-section">
          <h3>a RETEX tem o privilégio de colaborar com:</h3>
          <div className="partners-row">
            <span className="partners-side">ANTERIOR</span>
            <div className="partner-pill" />
            <div className="partner-pill" />
            <div className="partner-pill" />
            <div className="partner-pill" />
            <span className="partners-side">PRÓXIMO</span>
          </div>
        </section>

        <section className="landing-form" id="formulario">
          <h2>Formulário</h2>
          <p>
            Agenda a tua recolha e dá uma nova vida aos teus têxteis.
            <br />
            Menos lixo no planeta, mais futuro para todos.
          </p>
          <ContactForm />
        </section>

        <section id="faq" className="landing-section faq">
          <h2>Perguntas frequentes</h2>
          <p className="faq-subtitle">
            Tens dúvidas sobre a RETEX? Aqui encontras as respostas às questões
            mais comuns
          </p>
          <div className="faq-list">
            <details>
              <summary>O que é a RETEX?</summary>
              <p>
                Plataforma de economia circular para recolha, triagem e
                reutilização têxtil.
              </p>
            </details>
            <details>
              <summary>Como posso contribuir para a RETEX?</summary>
              <p>
                Agenda a recolha no formulário e entrega roupa em bom estado.
              </p>
            </details>
            <details>
              <summary>O que acontece às roupas recolhidas?</summary>
              <p>
                São triadas e encaminhadas para reutilização, doação ou
                reciclagem.
              </p>
            </details>
            <details>
              <summary>A RETEX só trabalha com roupa usada?</summary>
              <p>
                Recolhemos têxteis e vestuário pós-consumo limpos e em condições
                adequadas para triagem.
              </p>
            </details>
            <details>
              <summary>Como posso trabalhar convosco?</summary>
              <p>
                Enviamos oportunidades e parcerias através dos nossos canais
                oficiais. Deixa contacto no formulário com o assunto
                &quot;Carreiras&quot; ou &quot;Parcerias&quot;.
              </p>
            </details>
          </div>
        </section>

        <section id="blog" className="landing-section blog">
          <p className="blog-kicker">Novidades</p>
          <h2>O Nosso Blog</h2>
          <div className="blog-grid">
            <article className="blog-featured">
              <div className="blog-featured-visual blog-featured-visual--placeholder" />
              <div className="blog-copy blog-copy--featured">
                <small>Categoria</small>
                <h3>Título do post no Blog</h3>
                <p>
                  Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
                  dolorem sed distinctio impedit. At vero eos et accusam et
                  justo duo dolores et ea rebum.
                </p>
                <div className="blog-meta-row">
                  <time className="blog-date" dateTime="2025-05-13">
                    13.05.25
                  </time>
                </div>
              </div>
            </article>
            <div className="blog-side">
              <article className="blog-row">
                <div className="blog-thumb">
                  <div className="blog-thumb-placeholder" aria-hidden />
                </div>
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog Título do post no Blog</h3>
                  <p>
                    Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
                    dolorem.
                  </p>
                  <div className="blog-meta-row">
                    <time className="blog-date" dateTime="2025-05-13">
                      13.05.25
                    </time>
                  </div>
                </div>
              </article>
              <article className="blog-row">
                <div className="blog-thumb">
                  <div className="blog-thumb-placeholder" aria-hidden />
                </div>
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog Título do post no Blog</h3>
                  <p>
                    Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
                    dolorem.
                  </p>
                  <div className="blog-meta-row">
                    <time className="blog-date" dateTime="2025-05-13">
                      13.05.25
                    </time>
                  </div>
                </div>
              </article>
              <article className="blog-row">
                <div className="blog-thumb">
                  <div className="blog-thumb-placeholder" aria-hidden />
                </div>
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog Título do post no Blog</h3>
                  <p>
                    Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
                    dolorem.
                  </p>
                  <div className="blog-meta-row">
                    <time className="blog-date" dateTime="2025-05-13">
                      13.05.25
                    </time>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          Política de Privacidade | Política de Cookies | Livro de Reclamações
          Online
        </footer>
      </div>
    </main>
  );
}
