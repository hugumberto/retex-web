export interface VisionLabel {
  description: string;
  score: number;
}

export interface VisionResult {
  labels: VisionLabel[];
  objects: VisionLabel[];
}
