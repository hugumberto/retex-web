import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutUs from "@/components/landing/AboutUs";
import ContactForm from "@/components/landing/ContactForm";
import FAQ from "@/components/landing/FAQ";

export default function Home() {
  return (
    <div className="font-sans">
      <Hero />
      <HowItWorks />
      <AboutUs />
      <ContactForm />
      <FAQ />
      <footer className="text-xs text-center text-gray-400 py-6">
        <p>
          Política de Privacidade | Política de Cookies | Livro de Reclamações
          Online
        </p>
      </footer>
    </div>
  );
}
