import { PackageStatus } from './package';

export interface PackagesStats {
  total: number;
  totalWeightKg: number;
  totalVolumes: number;
  byStatus: { status: PackageStatus; count: number }[];
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
  totalPackages: number;
  topCities: { city: string; count: number }[];
}

export interface DashboardStatsDTO {
  packages: PackagesStats;
  triage: TriageStats;
  environment: EnvironmentStats;
  users: UsersStats;
  outOfZone: OutOfZoneStats;
}
