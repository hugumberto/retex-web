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
}

export enum BlogCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface BlogCategory extends Entity {
  title: string;
  slug: string;
  status: BlogCategoryStatus;
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
}
