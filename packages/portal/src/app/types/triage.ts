/**
 * Modelo de triagem e armazenamento (espelha a API).
 *
 * O lote físico é decidido só pelos indicadores básicos: grupo (Homem / Mulher
 * / Criança) × estação × parte (Superior / Inferior), mais um lote único não
 * reutilizável. O resto da peça (categoria, estado, destino, marca…) é
 * informativo, para relatórios.
 */

export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum AgeGroup {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
}

export enum Type {
  UPPER_PART = 'UPPER_PART',
  UNDER_PART = 'UNDER_PART',
}

export enum Season {
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
}

export enum Condition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  REGULAR = 'REGULAR',
}

export enum Destination {
  REUSE = 'REUSE',
  VINTAGE = 'VINTAGE',
  RECONDITIONING = 'RECONDITIONING',
  UPCYCLING = 'UPCYCLING',
  STOCK_RESERVE = 'STOCK_RESERVE',
  NON_REUSABLE = 'NON_REUSABLE',
  // Não recolhemos, mas registamos para monitorizar; não vai para nenhum lote.
  ACCESSORY = 'ACCESSORY',
}

export const REUSABLE_DESTINATIONS = [
  Destination.REUSE,
  Destination.VINTAGE,
  Destination.RECONDITIONING,
  Destination.UPCYCLING,
  Destination.STOCK_RESERVE,
];

export const isReusableDestination = (destination?: Destination | null) =>
  !!destination && REUSABLE_DESTINATIONS.includes(destination);

/**
 * Categoria da peça. Conjuntos de duas partes são separados: cada parte é
 * registada como uma peça, para cair no lote certo.
 */
export enum Category {
  TOP = 'TOP',
  SWEATER = 'SWEATER',
  COAT = 'COAT',
  DRESS = 'DRESS',
  SUIT_JACKET = 'SUIT_JACKET',
  PAJAMA_TOP = 'PAJAMA_TOP',
  SPORTSWEAR_TOP = 'SPORTSWEAR_TOP',
  BRA = 'BRA',
  UNDERSHIRT = 'UNDERSHIRT',
  SWIM_TOP = 'SWIM_TOP',
  SWIMSUIT = 'SWIMSUIT',
  TROUSERS = 'TROUSERS',
  SHORTS = 'SHORTS',
  SKIRT = 'SKIRT',
  JUMPSUIT = 'JUMPSUIT',
  SUIT_TROUSERS = 'SUIT_TROUSERS',
  PAJAMA_BOTTOM = 'PAJAMA_BOTTOM',
  SPORTSWEAR_BOTTOM = 'SPORTSWEAR_BOTTOM',
  UNDERPANTS = 'UNDERPANTS',
  SWIM_BOTTOM = 'SWIM_BOTTOM',
}

// Lote (Superior / Inferior) de cada categoria.
export const CATEGORY_PART: Record<Category, Type> = {
  [Category.TOP]: Type.UPPER_PART,
  [Category.SWEATER]: Type.UPPER_PART,
  [Category.COAT]: Type.UPPER_PART,
  [Category.DRESS]: Type.UPPER_PART,
  [Category.SUIT_JACKET]: Type.UPPER_PART,
  [Category.PAJAMA_TOP]: Type.UPPER_PART,
  [Category.SPORTSWEAR_TOP]: Type.UPPER_PART,
  [Category.BRA]: Type.UPPER_PART,
  [Category.UNDERSHIRT]: Type.UPPER_PART,
  [Category.SWIM_TOP]: Type.UPPER_PART,
  [Category.SWIMSUIT]: Type.UPPER_PART,
  [Category.TROUSERS]: Type.UNDER_PART,
  [Category.SHORTS]: Type.UNDER_PART,
  [Category.SKIRT]: Type.UNDER_PART,
  [Category.JUMPSUIT]: Type.UNDER_PART,
  [Category.SUIT_TROUSERS]: Type.UNDER_PART,
  [Category.PAJAMA_BOTTOM]: Type.UNDER_PART,
  [Category.SPORTSWEAR_BOTTOM]: Type.UNDER_PART,
  [Category.UNDERPANTS]: Type.UNDER_PART,
  [Category.SWIM_BOTTOM]: Type.UNDER_PART,
};

// Grupo do lote físico. NON_REUSABLE é o lote único sem estação nem parte.
export enum StorageGroup {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  CHILDREN = 'CHILDREN',
  NON_REUSABLE = 'NON_REUSABLE',
}

export type StorageSlot = {
  group: StorageGroup;
  season: Season | null;
  type: Type | null;
};

type SlotSource = {
  destination?: Destination | null;
  sex?: Sex | null;
  ageGroup?: AgeGroup | null;
  season?: Season | null;
  type?: Type | null;
};

/**
 * Lote onde a peça deve ser armazenada, ou `null` quando não vai para lote
 * nenhum (acessórios). Mesma regra que a API usa ao vincular.
 */
export function resolveStorageSlot(item: SlotSource): StorageSlot | null {
  const destination = item.destination ?? Destination.REUSE;
  if (destination === Destination.NON_REUSABLE) {
    return { group: StorageGroup.NON_REUSABLE, season: null, type: null };
  }
  if (!isReusableDestination(destination)) return null;
  if (!item.sex || !item.ageGroup || !item.season || !item.type) return null;

  // Criança é um só lote físico; o sexo fica registado só na peça.
  const group =
    item.ageGroup === AgeGroup.CHILD
      ? StorageGroup.CHILDREN
      : item.sex === Sex.MALE
      ? StorageGroup.MEN
      : StorageGroup.WOMEN;

  return { group, season: item.season, type: item.type };
}

// Chave de casamento peça <-> lote.
export const storageSlotKey = (slot: {
  group: string;
  season?: string | null;
  type?: string | null;
}) => `${slot.group}::${slot.season ?? '-'}::${slot.type ?? '-'}`;
