export interface SystemParameterDTO {
  id: string;
  collectionConfirmationDeadlineDays: number;
  qrCodeThresholdPercentage: number;
  /** Etiqueta de saco, em milímetros. */
  labelWidthMm: number;
  labelHeightMm: number;
  /** Lado do QR impresso na etiqueta. */
  labelQrSizeMm: number;
}

/** Medidas do rolo em uso, quando os parâmetros não chegam (403, rede, etc.). */
export const DEFAULT_LABEL_SIZE = {
  labelWidthMm: 50,
  labelHeightMm: 30,
  labelQrSizeMm: 24,
} as const;

/** Margem interna da etiqueta, em mm — igual de cada lado. */
export const LABEL_PADDING_MM = 2;
