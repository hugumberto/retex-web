import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Normaliza um código amigável (`ano-XXXXXX`) para a forma em que a API o
 * grava — sempre maiúsculas. Espelha `normalizeFriendlyCode` em
 * `app/use-cases/shared/identifier.util.ts` na API.
 *
 * Só para o código: o token do QR é hexadecimal minúsculo e não se normaliza.
 */
export function normalizeFriendlyCode(value: string): string {
  return value.trim().toUpperCase();
}
