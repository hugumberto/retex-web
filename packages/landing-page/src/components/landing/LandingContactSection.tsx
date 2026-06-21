import ContactForm from '@/components/landing/ContactForm';

export default function LandingContactSection() {
  return (
    <section className="landing-form" id="formulario">
      <h2>Formulário</h2>
      <p>
        <strong>Tem dúvidas? Estamos aqui para ajudar!</strong>
        <br />
        Preencha o formulário e entre em contacto connosco.
      </p>
      <ContactForm />
    </section>
  );
}
