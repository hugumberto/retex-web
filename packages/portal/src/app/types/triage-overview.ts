export enum TriageStationStatus {
  FREE = 'FREE',
  SORTING = 'SORTING',
  PAUSED = 'PAUSED',
}

export type TriageOverviewStation = {
  number: number;
  status: TriageStationStatus;
  operatorName: string | null;
  request: {
    id: string;
    code: string | null;
    clientName: string | null;
    bags: number;
    bagsProcessed: number;
    pieces: number;
  } | null;
  assigned: { id: string; code: string | null } | null;
  rhythm: number | null;
};

export type TriageOverviewQueueEntry = {
  id: string;
  code: string | null;
  clientName: string | null;
  bags: number;
  bagsProcessed: number;
  collectedAt: string | null;
  waitingDays: number | null;
  assignedStation: number | null;
};

export type TriageOverviewAlert =
  | { type: 'UNBOXED_LOT'; station: number; lot: { label: string; pieces: number } }
  | { type: 'WRONG_BAG'; station: number; at: string; code: string; otherRequestCode: string | null }
  | { type: 'WAITING'; code: string | null; clientName: string | null; waitingDays: number };

export type TriageOverview = {
  generatedAt: string;
  targetPerHour: number;
  kpis: {
    pieces: number;
    accessories: number;
    activeStations: number;
    weightKg: number;
    kgPerPiece: number | null;
    avgRhythm: number | null;
    bagsToSort: number;
    requestsDone: number;
    lastDoneAt: string | null;
  };
  stations: TriageOverviewStation[];
  queue: TriageOverviewQueueEntry[];
  destinations: { reuse: number; upcycling: number; nonReusable: number };
  daysToClearSorting: number | null;
  alerts: TriageOverviewAlert[];
};

export type TriageExportRow = {
  createdAt: string;
  station: number | null;
  operatorName: string | null;
  requestCode: string | null;
  clientName: string | null;
  bagCode: string | null;
  quantity: number;
  destination: string;
  category: string | null;
  condition: string | null;
  sex: string | null;
  ageGroup: string | null;
  season: string | null;
  brand: string | null;
  storageUnitCode: string | null;
};
