import Script from 'next/script';

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
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
  );
}
