import { Entity } from './helper';

export interface BlogPostFormData {
  id?: string;
  body: string;
  slug: string;
  title: string;
  hero: string; // base64
  status: BlogPostStatus;
  highlight: BlogPostHighlight;
  tags: string[];
  categoryIds: string[];
  summary?: string | null;
  heroAlt?: string | null;
  publishDate?: string | null;
}

export enum BlogCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface BlogCategory extends Entity {
  title: string;
  slug: string;
  status: BlogCategoryStatus;
  description?: string | null;
  position?: number;
  // Só nas listagens do backoffice.
  postsCount?: number;
}

// Mirrors the backend (source of truth): highlight is stored as an integer.
// NONE=0, FEATURED=1, HIGHLIGHTED=2
export enum BlogPostHighlight {
  NONE = 0,
  FEATURED = 1,
  HIGHLIGHTED = 2,
}

export enum BlogPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  // Publica-se sozinho na data escolhida.
  SCHEDULED = 'SCHEDULED',
}

export interface BlogPostDTO extends Entity {
  body: string;
  slug: string;
  title: string;
  hero: string; // base64
  status: BlogPostStatus;
  highlight: BlogPostHighlight;
  tags: string[];
  categories?: BlogCategory[];
  summary?: string | null;
  heroAlt?: string | null;
  publishDate?: string | null;
}
