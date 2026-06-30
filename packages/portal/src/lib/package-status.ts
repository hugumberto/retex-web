import { PackageStatus } from '@/app/types/package';

export const STATUS_LABEL: Record<PackageStatus, string> = {
  [PackageStatus.CREATED]: 'Criado',
  [PackageStatus.OUT_OF_ZONE]: 'Fora da Zona',
  [PackageStatus.WAITING_FOR_COLLECTION]: 'Aguarda Recolha',
  [PackageStatus.COLLECTED]: 'Recolhido',
  [PackageStatus.IN_TRANSIT]: 'Em Trânsito',
  [PackageStatus.IN_HOUSE]: 'Em Armazém',
  [PackageStatus.CANCELLED]: 'Cancelado',
  [PackageStatus.SCREENING]: 'Em Triagem',
  [PackageStatus.STOCKED]: 'Concluído',
};

export const STATUS_CLASS: Record<PackageStatus, string> = {
  [PackageStatus.CREATED]: 'bg-blue-100 text-blue-700',
  [PackageStatus.OUT_OF_ZONE]: 'bg-amber-100 text-amber-700',
  [PackageStatus.WAITING_FOR_COLLECTION]: 'bg-yellow-100 text-yellow-700',
  [PackageStatus.COLLECTED]: 'bg-teal-100 text-teal-700',
  [PackageStatus.IN_TRANSIT]: 'bg-purple-100 text-purple-700',
  [PackageStatus.IN_HOUSE]: 'bg-indigo-100 text-indigo-700',
  [PackageStatus.CANCELLED]: 'bg-red-100 text-red-600',
  [PackageStatus.SCREENING]: 'bg-cyan-100 text-cyan-700',
  [PackageStatus.STOCKED]: 'bg-emerald-100 text-emerald-700',
};

/** Cor (hex) por status, para usar em gráficos (recharts). */
export const STATUS_COLOR: Record<PackageStatus, string> = {
  [PackageStatus.CREATED]: '#3b82f6',
  [PackageStatus.OUT_OF_ZONE]: '#f59e0b',
  [PackageStatus.WAITING_FOR_COLLECTION]: '#eab308',
  [PackageStatus.COLLECTED]: '#14b8a6',
  [PackageStatus.IN_TRANSIT]: '#a855f7',
  [PackageStatus.IN_HOUSE]: '#6366f1',
  [PackageStatus.CANCELLED]: '#dc2626',
  [PackageStatus.SCREENING]: '#06b6d4',
  [PackageStatus.STOCKED]: '#10b981',
};
