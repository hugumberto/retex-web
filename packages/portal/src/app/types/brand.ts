export interface Brand {
  id: string;
  name: string;
  manual: boolean;
}
export interface BrandResponse extends Brand {
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}
