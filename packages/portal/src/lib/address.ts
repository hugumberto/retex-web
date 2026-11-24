/** Código postal português com hífen (4470157 → 4470-157); outros ficam como estão. */
export const formatZip = (zip?: string | null): string => {
  const value = (zip ?? '').trim();
  const digits = value.replace(/\D/g, '');
  return /^\d{7}$/.test(digits) && /^[\d\s-]+$/.test(value) ? `${digits.slice(0, 4)}-${digits.slice(4)}` : value;
};

/** "Rua X, 100" — sem vírgula a mais quando o número vem vazio (ou já está na rua). */
export const streetLine = (street?: string | null, number?: string | null): string =>
  [street?.trim(), number?.trim()].filter(Boolean).join(', ');
