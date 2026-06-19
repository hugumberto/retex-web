import LandingFaq from '@/components/landing/LandingFaq';
import LandingFooter from '@/components/landing/LandingFooter';
import { Header } from '@/components/landing/Header';

export const metadata = {
  title: 'FAQ | RETEX',
  description: 'Perguntas frequentes sobre a RETEX e instruções para recolha de têxteis.',
};

export default function FaqPage() {
  return (
    <main className="landing-shell flex flex-col min-h-screen">
      <Header />
      <div className="landing-page flex-1">
        <LandingFaq />
      </div>
      <LandingFooter />
    </main>
  );
}
