import HomeContactForm from '@/components/home/HomeContactForm';
import HomeFaq from '@/components/home/HomeFaq';
import HomeHero from '@/components/home/HomeHero';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeImpactStats from '@/components/home/HomeImpactStats';
import HomeJourney from '@/components/home/HomeJourney';
import HomePartners from '@/components/home/HomePartners';
import HomeProfiles from '@/components/home/HomeProfiles';
import HomeUpcycling from '@/components/home/HomeUpcycling';
import HomeWhyItMatters from '@/components/home/HomeWhyItMatters';
import SiteFooter from '@/components/home/SiteFooter';
import SiteHeader from '@/components/home/SiteHeader';
import { Section } from '@/components/home/ui';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-mist font-display text-navy antialiased">
      <SiteHeader />
      <main>
        <HomeHero />
        <HomeProfiles />
        <HomeHowItWorks />
        <HomeJourney />
        <HomeWhyItMatters />
        <HomeImpactStats />
        <HomeUpcycling />
        <HomePartners />
        <Section
          id="contacto"
          className="border-t border-line bg-white py-20"
          innerClassName="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between"
        >
          <HomeFaq />
          {/* useSearchParams (perfil pré-escolhido) exige um Suspense numa
              página estática. */}
          <Suspense>
            <HomeContactForm />
          </Suspense>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
