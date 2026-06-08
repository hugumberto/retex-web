import { useEffect, useRef, useState } from 'react';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

// COCO-SSD has no classes for garments (shirt, pants, jacket, etc.).
// These are the only fashion-accessory classes available in the model.
const CLOTHING_CLASSES = new Set([
  'tie',      // necktie / scarf
  'backpack', // backpack / shoulder bag
  'handbag',  // handbag / purse
]);

export function useTensorflow(videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const modelRef = useRef<any>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function loadModel() {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      modelRef.current = await cocoSsd.load();
      setModelReady(true);
    }

    loadModel();
  }, [enabled]);

  useEffect(() => {
    if (!modelReady || !enabled || !videoRef.current) return;

    async function detect() {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        const predictions = await modelRef.current.detect(videoRef.current);
        const relevant = predictions.filter(
          (p: any) => CLOTHING_CLASSES.has(p.class) && p.score >= 0.5,
        );
        setDetections(relevant);
      } catch {}
      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [modelReady, enabled, videoRef]);

  const hasClothingDetected = detections.some((d) => d.score >= 0.5);

  return { detections, modelReady, hasClothingDetected };
}
