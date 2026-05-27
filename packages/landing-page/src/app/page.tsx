import LandingAbout from '@/components/landing/LandingAbout';
import LandingBlog from '@/components/landing/LandingBlog';
import LandingContactSection from '@/components/landing/LandingContactSection';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingPartners from '@/components/landing/LandingPartners';
import LandingQuote from '@/components/landing/LandingQuote';
import LandingServices from '@/components/landing/LandingServices';
import LandingUpcycling from '@/components/landing/LandingUpcycling';
import LandingValues from '@/components/landing/LandingValues';

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="landing-page">
        <LandingHero />
        <LandingHowItWorks />
        <LandingServices />
        <LandingAbout />
        <LandingValues />
        <LandingQuote />
        <LandingUpcycling />
        <LandingPartners />
        <LandingContactSection />
        <LandingFaq />
        <LandingBlog />
        <LandingFooter />
      </div>
    </main>
  );
}
