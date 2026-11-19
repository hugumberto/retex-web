'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

// O único host de produção. Tudo o resto — localhost, portal-dev.retex.pt,
// previews da Vercel — é ambiente de trabalho e leva etiqueta. Lista em vez de
// constante para dar lugar a um domínio novo sem mexer na lógica.
const PRODUCTION_HOSTNAMES = ['portal.retex.pt'];
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1'];

// Constante de build: o Next substitui-a no bundle.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const API_HOST = (() => {
  if (!API_URL) return 'API por definir';
  try {
    return new URL(API_URL).host;
  } catch {
    // URL malformada: mostrar o valor cru é mais útil do que esconder o erro.
    return API_URL;
  }
})();

const IS_LOCAL_API = LOCAL_HOSTNAMES.some((host) => API_HOST.startsWith(host));

type Environment = { label: string; isLocalPortal: boolean };

const resolveEnvironment = (hostname: string): Environment | null => {
  if (PRODUCTION_HOSTNAMES.includes(hostname)) return null;
  // `.localhost` também resolve para a máquina (app.localhost, portal.localhost).
  if (LOCAL_HOSTNAMES.includes(hostname) || hostname.endsWith('.localhost')) {
    return { label: 'DEV', isLocalPortal: true };
  }
  // Deploys descartáveis da Vercel distinguem-se do portal de dev partilhado.
  const label = hostname.endsWith('.vercel.app') ? 'PREVIEW' : 'DEV';
  return { label, isLocalPortal: false };
};

/**
 * Etiqueta de ambiente na barra de topo, em tudo o que não é produção: o portal
 * local, o portal-dev e os previews.
 *
 * Os ecrãs são iguais aos de produção e, depois de um `db:refresh`, os dados
 * também são reais — sem isto é fácil triar, cancelar ou apagar a pensar que se
 * está no sítio certo.
 *
 * Fica vermelha quando o portal corre local mas fala com uma API remota, que é
 * o caso que estraga dados a sério. Um portal publicado (dev/preview) fala
 * legitimamente com uma API publicada, por isso aí a etiqueta é neutra — mas
 * mostra sempre o host, para se ver de relance a que backend se está ligado.
 *
 * Sem i18n de propósito: nunca chega a um utilizador final.
 */
export default function EnvBadge() {
  // O hostname só existe no browser. Decidir no render do servidor dava um
  // hydration mismatch, por isso a etiqueta só entra depois de montar.
  const [environment, setEnvironment] = useState<Environment | null>(null);

  useEffect(() => {
    setEnvironment(resolveEnvironment(window.location.hostname));
  }, []);

  if (!environment) return null;

  const isDangerous = environment.isLocalPortal && !IS_LOCAL_API;

  return (
    <span
      title={`Ambiente: ${environment.label} · API: ${
        API_URL || 'NEXT_PUBLIC_API_URL por definir'
      }`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isDangerous
          ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isDangerous && <TriangleAlert className="size-3.5" />}
      {environment.label}
      <span className="hidden font-normal opacity-80 sm:inline">
        · {API_HOST}
      </span>
    </span>
  );
}
