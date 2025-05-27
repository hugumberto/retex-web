import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import AboutUs from '@/components/landing/AboutUs';
import ContactForm from '@/components/landing/ContactForm';
import FAQ from '@/components/landing/FAQ';
import { Header } from '@/components/landing/Header';

export default function Home() {
  return (
    <div className="font-family-poppins">
      <Header />
      <div>
        <Hero />
        <HowItWorks />
        <AboutUs />
        <ContactForm />
        <FAQ />
      </div>
      <footer className="text-xs text-center text-white  bg-gradient-horizontal py-6">
        <p>
          Política de Privacidade | Política de Cookies | Livro de Reclamações
          Online
        </p>
      </footer>
    </div>
  );
}
