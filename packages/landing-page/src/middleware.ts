import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Tudo excepto rotas de API, ficheiros internos do Next/Vercel e qualquer
  // caminho com extensão (imagens, robots.txt, sitemap.xml, ...).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
