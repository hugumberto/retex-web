import LandingFaq from '@/components/landing/LandingFaq';
import LandingFooter from '@/components/landing/LandingFooter';
import { Header } from '@/components/landing/Header';

export const metadata = {
  title: 'FAQ | RETEX',
  description: 'Perguntas frequentes sobre a RETEX e instruções para recolha de têxteis.',
};

export default function FaqPage() {
  return (
    <main className="landing-shell">
      <Header />
      <div className="landing-page">
        <LandingFaq />
      </div>
      <LandingFooter />
    </main>
  );
}
