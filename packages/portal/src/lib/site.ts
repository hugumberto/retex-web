/**
 * Endereço do site público (landing). O portal corre em `portal.<domínio>` ou
 * `portal-<ambiente>.<domínio>`; o site está no mesmo domínio sem o prefixo.
 */
export const siteUrl = (): string => {
  if (typeof window === 'undefined') return 'https://retex.pt';
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${hostname}:3001`;
  const site = hostname.replace(/^portal[-.]/, '');
  return `${protocol}//${site}`;
};
