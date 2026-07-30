export interface BlogCategory {
  id: string;
  title: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  body: string;
  hero: string;
  publishDate?: string;
  categories?: BlogCategory[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Remove tags HTML para gerar texto simples (preview/excerto e meta description).
 * Apenas para texto — o resultado vai para um nó de texto React (auto-escapado).
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(html: string, max = 160): string {
  const text = stripHtml(html);
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Formata uma data ISO como dd.mm.yy. */
export function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

/**
 * Formata uma data ISO por extenso no idioma pedido
 * ("13 de maio de 2025", "13 May 2025", ...).
 */
export function formatDateLong(iso?: string, locale = 'pt-PT'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Devolve yyyy-mm-dd para o atributo dateTime de <time>. */
export function isoDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Base da API garantindo barra final única. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}${path}`;
}
