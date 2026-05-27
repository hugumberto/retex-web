export default function LandingFaq() {
  return (
    <section id="faq" className="landing-section faq">
      <h2>Perguntas frequentes</h2>
      <p className="faq-subtitle">
        Tens dúvidas sobre a RETEX? Aqui encontras as respostas às questões mais
        comuns
      </p>
      <div className="faq-list">
        <details>
          <summary>O que é a RETEX?</summary>
          <p>
            Plataforma de economia circular para recolha, triagem e reutilização
            têxtil.
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
            São triadas e encaminhadas para reutilização, doação ou reciclagem.
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
            Enviamos oportunidades e parcerias através dos nossos canais oficiais.
            Deixa contacto no formulário com o assunto &quot;Carreiras&quot; ou
            &quot;Parcerias&quot;.
          </p>
        </details>
      </div>
    </section>
  );
}
