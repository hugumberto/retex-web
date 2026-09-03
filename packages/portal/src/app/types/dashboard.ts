import { CollectionRequestStatus } from './collection-request';

export interface CollectionRequestsStats {
  total: number;
  totalWeightKg: number;
  totalEstimatedBags: number;
  totalCollectedBags: number;
  byStatus: { status: CollectionRequestStatus; count: number }[];
  trend: { period: string; weightKg: number; count: number }[];
}

export interface DimensionStat {
  key: string;
  count: number;
  quantity: number;
}

export interface TriageStats {
  totalItems: number;
  byQuality: DimensionStat[];
  bySeason: DimensionStat[];
  byType: DimensionStat[];
  byBrand: { brand: string; count: number; quantity: number }[];
}

export interface EnvironmentStats {
  landfillDivertedKg: number;
  co2AvoidedKg: number;
  waterSavedLiters: number;
  factors: {
    co2KgPerKg: number;
    waterLitersPerKg: number;
  };
}

export interface UsersStats {
  total: number;
  active: number;
  statusActive: number;
}

export interface OutOfZoneStats {
  totalCollectionRequests: number;
  topCities: { city: string; count: number }[];
}

export interface DashboardStatsDTO {
  collectionRequests: CollectionRequestsStats;
  triage: TriageStats;
  environment: EnvironmentStats;
  users: UsersStats;
  outOfZone: OutOfZoneStats;
}

export interface CompanyBreakdownEntry {
  id: string;
  label: string;
  count: number;
  weightKg: number;
}

/**
 * Resposta de GET /dashboard/me — os indicadores do próprio cliente.
 *
 * Não traz `users` nem `outOfZone`: o primeiro é degenerado para um particular
 * e o segundo é prospeção interna da Retex.
 */
export interface ScopedDashboardStatsDTO {
  scope: 'COMPANY' | 'USER';
  company?: { id: string; name: string };
  collectionRequests: CollectionRequestsStats;
  triage: TriageStats;
  environment: EnvironmentStats;
  /** Só para empresas. */
  breakdown?: {
    byMember: CompanyBreakdownEntry[];
    byAddress: CompanyBreakdownEntry[];
  };
}

/**
 * Resposta de GET /dashboard/activity — o funil do período.
 *
 * `from`/`to` ecoam o filtro aplicado (null = sem limite), para o ecrã poder
 * confirmar o que está a mostrar.
 */
export interface DashboardActivityDTO {
  from: string | null;
  to: string | null;
  requests: number;
  collections: number;
  triages: number;
  pieces: number;
}
