import { CollectionRequestStatus } from './collection-request';

export interface CollectionRequestsStats {
  total: number;
  totalWeightKg: number;
  totalVolumes: number;
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
