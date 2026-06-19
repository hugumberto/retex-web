import ContactForm from '@/components/landing/ContactForm';

export default function LandingContactSection() {
  return (
    <section className="landing-form" id="formulario">
      <h2>Formulário</h2>
      <p>
        Agenda a tua recolha e dá uma nova vida aos teus têxteis.
        <br />
        Menos lixo no planeta, mais futuro para todos.
      </p>
      <ContactForm />
    </section>
  );
}
