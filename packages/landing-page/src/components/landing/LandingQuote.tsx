export default function LandingQuote() {
  return (
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
  );
}
