import LandingAbout from '@/components/landing/LandingAbout';
import LandingBlog from '@/components/landing/LandingBlog';
import LandingContactSection from '@/components/landing/LandingContactSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingQuote from '@/components/landing/LandingQuote';
import LandingServices from '@/components/landing/LandingServices';
import LandingUpcycling from '@/components/landing/LandingUpcycling';
import LandingValues from '@/components/landing/LandingValues';
import { setRequestLocale } from 'next-intl/server';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="landing-shell">
      <LandingHero />
      <div className="landing-page">
        <LandingHowItWorks />
        <LandingServices />
        <LandingAbout />
        <LandingValues />
        <LandingQuote />
        <LandingUpcycling />
        {/* <LandingPartners /> */}
        <LandingContactSection />
        <LandingBlog />
      </div>
      <LandingFooter />
    </main>
  );
}
