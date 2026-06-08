export interface VisionLabel {
  description: string;
  score: number;
}

export interface ClothingColor {
  hex: string;
  score: number;
  pixelFraction: number;
}

export interface VisionResult {
  labels: VisionLabel[];
  objects: VisionLabel[];
  clothing: {
    types: VisionLabel[];
    materials: VisionLabel[];
    styles: VisionLabel[];
    patterns: VisionLabel[];
  };
  colors: ClothingColor[];
}
