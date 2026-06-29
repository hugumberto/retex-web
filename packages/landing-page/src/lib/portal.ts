export const PORTAL_LOGIN_PLACEHOLDER = '#';

export function getPortalLoginHref(): string {
  const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim();
  if (!base) return PORTAL_LOGIN_PLACEHOLDER;
  return `${base.replace(/\/$/, '')}/auth/login`;
}
