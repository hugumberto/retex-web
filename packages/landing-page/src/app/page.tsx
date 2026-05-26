import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import AboutUs from '@/components/landing/AboutUs';
import ContactForm from '@/components/landing/ContactForm';
import FAQ from '@/components/landing/FAQ';
import { Header } from '@/components/landing/Header';
import Script from 'next/script';

export default function Home() {
  return (
    <div className="font-family-poppins flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Hero />
        <HowItWorks />
        <AboutUs />
        <ContactForm />
        <FAQ />
      </div>
      <footer className="mt-auto bg-gradient-horizontal py-6 text-center text-xs text-white">
        <p>
          <a
            href="https://www.iubenda.com/privacy-policy/50808874"
            target="_blank"
            rel="noreferrer"
            className="iubenda-nostyle iubenda-noiframe iubenda-embed"
            title="Política de Privacidade"
          >
            Política de Privacidade
          </a>{' '}
          |{' '}
          <a
            href="https://www.iubenda.com/privacy-policy/50808874/cookie-policy"
            target="_blank"
            rel="noreferrer"
            className="iubenda-nostyle iubenda-noiframe iubenda-embed"
            title="Política de Cookies"
          >
            Política de Cookies
          </a>{' '}
          | Livro de Reclamações Online
        </p>
        <div className="mt-4 flex justify-center">
          <Script
            src="https://embeds.iubenda.com/widgets/78514cef-8c00-492c-8d76-ba1a828d4cd0.js"
            strategy="afterInteractive"
          />
        </div>
      </footer>
    </div>
  );
}
