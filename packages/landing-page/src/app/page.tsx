import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="landing-page">
        <header className="landing-header">
          <Image
            src="/assets/new-layout/RETEX_LOGO.jpg"
            alt="RETEX"
            width={120}
            height={46}
            className="landing-logo"
          />
          <nav className="landing-nav">
            <a href="#como-funciona">Como funciona</a>
            <a href="#sobre-nos">Sobre nós</a>
            <a href="#blog">Blog</a>
            <a href="#faq">FAQ&apos;S</a>
            <a href="#login">Login</a>
            <button className="request-demo-btn" type="button">
              Request Demo
            </button>
          </nav>
        </header>

        <section className="landing-hero">
          <Image
            src="/assets/new-layout/FUNDO_HOMEPAGE.jpg"
            alt="Hero background"
            fill
            className="object-cover"
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
          <p className="section-kicker">O nosso serviço</p>
          <h2>Como funciona?</h2>
          <div className="icon-cards">
            {[
              {
                title: 'Preenche o formulário',
                description: 'Basta seguir até ao final da página e submeter os dados.',
              },
              {
                title: 'Agenda a tua recolha',
                description: 'Menciona o local e a hora mais indicado para ti.',
              },
              {
                title: 'Agora é connosco',
                description: 'Aguarda que um dos nossos transportadores entre em contacto contigo.',
              },
            ].map((item, index) => (
              <article key={item.title} className="icon-card">
                <span className="step-badge">{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <p className="section-kicker section-kicker-spaced">O que fizemos</p>
          <h2 className="section-title-alt">Até agora...</h2>
          <div className="stats-wrap">
            <Image
              src="/assets/new-layout/Group 1000002839.svg"
              alt="Métricas"
              width={210}
              height={114}
            />
          </div>
        </section>

        <section className="landing-grid-two">
          <article className="split-card split-text">
            <h3>Empresas e Municípios</h3>
            <p>
              A nossa solução permite às empresas e municípios fortalecerem a
              sua responsabilidade ambiental através de Créditos de
              Circularidade, ativos digitais que refletem o impacto positivo de
              doações têxteis e podem ser usados para compensar emissões.
            </p>
            <button type="button" className="primary-pill">
              Entrar em contacto
            </button>
          </article>
          <article className="split-card split-image-only">
            <Image
              src="/assets/new-layout/EMPRESAS.jpg"
              alt="Têxteis"
              width={372}
              height={292}
              className="split-image"
            />
          </article>
          <article className="split-card split-image-only">
            <Image
              src="/assets/new-layout/PARTICULARES.jpg"
              alt="Particulares"
              width={372}
              height={292}
              className="split-image"
            />
          </article>
          <article className="split-card split-text">
            <h3>Particulares</h3>
            <p>
              Tens roupa que já não usas? Dá-lhe um novo propósito! Se tens
              roupas em bom estado que já não usas, a RETEX ajuda-te a
              encaminhá-las para reutilização.
            </p>
            <Button className="landing-outline-btn">Agendar recolha</Button>
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
              Apresentamos a RETEX, uma plataforma que revoluciona a forma como
              lidamos com o desperdício têxtil. Tornamos a reutilização de
              têxtil mais simples, conveniente e eficiente, através de um
              modelo de recolha inovador e um compromisso real com a economia
              circular.
            </p>
            <p>
              Conectamos consumidores, empresas e municípios para dar nova vida
              aos têxteis, reduzir o desperdício e gerar impacto ambiental e
              social positivo.
            </p>
            <button type="button" className="primary-pill">
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
                title: 'Recolha Sustentável',
                text: 'Em Portugal, são mais de 200 mil. O problema cresce, mas temos solução.',
              },
              {
                icon: '/assets/new-layout/2.svg',
                title: 'Redução do Desperdício Têxtil',
                text: 'Damos nova vida a cada peça, evitando que toneladas acabem em aterros.',
              },
              {
                icon: '/assets/new-layout/4.svg',
                title: 'Impacto Social e Ambiental',
                text: 'Apoiamos causas sociais e práticas sustentáveis para reduzir a pegada ecológica.',
              },
              {
                icon: '/assets/new-layout/5.svg',
                title: 'Economia Circular',
                text: 'Transformamos resíduos em recursos, promovendo um consumo mais consciente.',
              },
            ].map((item) => (
              <article key={item.title} className="value-card">
                <Image src={item.icon} alt="" width={30} height={25} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="quote-section">
          <p className="quote-mark">“</p>
          <h3>
            Reciclar é reconhecer que <br /> tudo tem valor e merece uma <br />
            segunda vida.
          </h3>
          <p className="quote-author">- Jane Goodall</p>
        </section>

        <section className="upcycling-strip">
          <div>
            <p className="upcycling-kicker">UPCYCLING TÊXTIL</p>
            <h3>Dar uma nova vida ao material</h3>
            <p>
              Na RETEX, o upcycling é a forma mais criativa de prolongar a vida
              dos têxteis. Em vez de irem para o lixo, resíduos de produção e
              peças usadas são transformados em novos produtos com mais valor.
            </p>
            <small>RETEX - Made in Portugal</small>
          </div>
          <div className="upcycling-stat">
            <strong>100</strong>
            <span>% Sustentável</span>
          </div>
        </section>

        <section className="partners-section">
          <h3>A RETEX tem o privilégio de colaborar com:</h3>
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
          <form className="landing-form-card">
            <div className="form-row">
              <label>
                Nome:*
                <input type="text" />
              </label>
              <label>
                NIF:*
                <input type="text" />
              </label>
            </div>
            <div className="form-row">
              <label>
                Email:*
                <input type="email" />
              </label>
              <label>
                Telemóvel:*
                <input type="text" />
              </label>
            </div>
            <label>
              Local de recolha:*
              <input type="text" />
            </label>
            <label>
              Horário de recolha:*
              <input type="text" />
            </label>
            <label>
              Mensagem:*
              <textarea rows={4} />
            </label>
            <button type="submit">Submeter</button>
          </form>
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
              <summary>Como posso contribuir?</summary>
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
              <summary>A RETEX recolhe apenas roupa usada?</summary>
              <p>
                Recolhemos têxteis e vestuário pós-consumo limpos e em condições
                adequadas para triagem.
              </p>
            </details>
            <details>
              <summary>Empresas e municípios também podem participar?</summary>
              <p>
                Sim. Temos soluções dedicadas com relatórios de impacto e
                indicadores ESG.
              </p>
            </details>
          </div>
        </section>

        <section id="blog" className="landing-section blog">
          <p className="blog-kicker">Novidades</p>
          <h2>O Nosso Blog</h2>
          <div className="blog-grid">
            <article className="blog-featured">
              <Image
                src="/assets/new-layout/RECICLE.jpg"
                alt="Recicle"
                width={220}
                height={120}
              />
              <div className="blog-copy">
                <small>Categoria</small>
                <h3>Título do post no Blog</h3>
                <p>
                  Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
                  dolorem sed distinctio impedit.
                </p>
                <strong>13.05.25</strong>
              </div>
            </article>
            <div className="blog-side">
              <article>
                <Image
                  src="/assets/new-layout/TESOURA_COSTURA.jpg"
                  alt="Upcycling"
                  width={100}
                  height={120}
                />
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog</h3>
                  <p>Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem.</p>
                  <strong>13.05.25</strong>
                </div>
              </article>
              <article>
                <Image
                  src="/assets/new-layout/EMPRESAS.jpg"
                  alt="Circularidade"
                  width={100}
                  height={120}
                />
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog</h3>
                  <p>Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem.</p>
                  <strong>13.05.25</strong>
                </div>
              </article>
              <article>
                <Image
                  src="/assets/new-layout/PARTICULARES.jpg"
                  alt="Reutilização"
                  width={100}
                  height={120}
                />
                <div className="blog-copy">
                  <small>Categoria</small>
                  <h3>Título do post no Blog</h3>
                  <p>Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem.</p>
                  <strong>13.05.25</strong>
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
