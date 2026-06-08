import api from '@/lib/api';
import { VisionResult } from '@/app/types/vision';

export async function analyzeImage(imageBase64: string): Promise<VisionResult> {
  const response = await api.post<VisionResult>('/vision/analyze', { imageBase64 });
  return response.data;
}
