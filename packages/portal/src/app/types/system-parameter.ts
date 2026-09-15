export interface SystemParameterDTO {
  id: string;
  collectionConfirmationDeadlineDays: number;
  qrCodeThresholdPercentage: number;
  /** Etiqueta de saco, em milímetros. */
  labelWidthMm: number;
  labelHeightMm: number;
  /** Lado do QR impresso na etiqueta. */
  labelQrSizeMm: number;
  /** Rotação do conteúdo dentro da etiqueta: 0, 90, 180 ou 270 graus. */
  labelRotationDeg: number;
}

/** As únicas rotações que enquadram o conteúdo na etiqueta. */
export const LABEL_ROTATIONS = [0, 90, 180, 270] as const;

/** Medidas do rolo em uso, quando os parâmetros não chegam (403, rede, etc.). */
export const DEFAULT_LABEL_SIZE = {
  labelWidthMm: 50,
  labelHeightMm: 30,
  labelQrSizeMm: 24,
  // Nas impressoras em uso a cabeça térmica imprime ao alto; sem rodar, a
  // etiqueta sai deitada.
  labelRotationDeg: 90,
} as const;

/** Margem interna da etiqueta, em mm — igual de cada lado. */
export const LABEL_PADDING_MM = 2;
