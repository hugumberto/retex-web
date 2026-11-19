import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Script from 'next/script';

const EXTERNAL = {
  instagram: 'https://www.instagram.com/retexportugal/',
  linkedin: 'https://www.linkedin.com/company/retex-portugal',
  facebook: 'https://www.facebook.com/people/Retex-Portugal/61581085498824/',
  privacy: 'https://www.iubenda.com/privacy-policy/50808874',
  cookies: 'https://www.iubenda.com/privacy-policy/50808874/cookie-policy',
  complaints: 'https://www.livroreclamacoes.pt/',
};

export default function SiteFooter() {
  const t = useTranslations('home.footer');
  const link = 'text-white/85 hover:text-white';

  const columns = [
    {
      title: 'RETEX',
      links: [
        { href: '/#como-funciona', label: t('howItWorks') },
        { href: '/#porque-importa', label: t('about') },
        { href: '/blog', label: t('blog') },
        { href: '/faq', label: t('faq') },
      ],
    },
    {
      title: t('solutions'),
      links: [
        { href: '/?perfil=empresa#contacto', label: t('businesses') },
        { href: '/?perfil=municipio#contacto', label: t('municipalities') },
        { href: '/#upcycling', label: t('upcycling') },
        { href: '/projeto-prr', label: t('prr') },
      ],
    },
  ];

  return (
    <footer className="bg-[linear-gradient(145deg,#013364_0%,#02748e_100%)] px-4 pb-8 pt-14 text-sm sm:px-8">
      <div className="mx-auto flex w-full max-w-[1164px] flex-col gap-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/landing/logo-branco.svg"
              alt="ReTeX:ID"
              width={133}
              height={24}
            />
            <p className="font-mono text-[11px] text-white/70">
              wear. care. share. repeat.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-12">
            {columns.map((column) => (
              <nav key={column.title} className="flex flex-col gap-3">
                <p className="font-bold text-white">{column.title}</p>
                {column.links.map((item) => (
                  <Link key={item.href} href={item.href} className={link}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            ))}
            <div className="flex flex-col gap-3">
              <p className="font-bold text-white">{t('contact')}</p>
              <a href="mailto:geral@retex.pt" className={link}>
                geral@retex.pt
              </a>
              <a href={EXTERNAL.instagram} target="_blank" rel="noreferrer" className={link}>
                Instagram
              </a>
              <a href={EXTERNAL.linkedin} target="_blank" rel="noreferrer" className={link}>
                LinkedIn
              </a>
              <a href={EXTERNAL.facebook} target="_blank" rel="noreferrer" className={link}>
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 border-t border-white/20 pt-5 text-xs">
          <a
            href={EXTERNAL.privacy}
            target="_blank"
            rel="noreferrer"
            className={`iubenda-nostyle iubenda-noiframe iubenda-embed ${link}`}
          >
            {t('privacy')}
          </a>
          <a
            href={EXTERNAL.cookies}
            target="_blank"
            rel="noreferrer"
            className={`iubenda-nostyle iubenda-noiframe iubenda-embed ${link}`}
          >
            {t('cookies')}
          </a>
          <a href={EXTERNAL.complaints} target="_blank" rel="noreferrer" className={link}>
            {t('complaints')}
          </a>
        </div>
      </div>

      <Script
        src="https://embeds.iubenda.com/widgets/78514cef-8c00-492c-8d76-ba1a828d4cd0.js"
        strategy="afterInteractive"
      />
    </footer>
  );
}
