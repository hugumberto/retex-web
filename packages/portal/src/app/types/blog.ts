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
}

export enum BlogPostHighlight {
  NONE = 'NONE',
  HIGHLIGHTED = 'HIGHLIGHTED',
  FEATURED = 'FEATURED',
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
}
