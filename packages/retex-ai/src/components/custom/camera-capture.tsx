'use client';

import { useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/use-camera';
import { useTensorflow } from '@/hooks/use-tensorflow';
import { analyzeImage } from '@/service/vision';
import { VisionResult } from '@/app/types/vision';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  deviceId: string;
  onResult: (result: VisionResult) => void;
}

export function CameraCapture({ deviceId, onResult }: CameraCaptureProps) {
  const { videoRef, error, captureFrame } = useCamera(deviceId);
  const { hasClothingDetected, modelReady } = useTensorflow(videoRef, true);
  const [analyzing, setAnalyzing] = useState(false);
  const autoCaptureDone = useRef(false);

  useEffect(() => {
    if (hasClothingDetected && !autoCaptureDone.current && !analyzing) {
      autoCaptureDone.current = true;
      handleCapture();
    }
  }, [hasClothingDetected]);

  async function handleCapture() {
    const base64 = captureFrame();
    if (!base64) return;
    setAnalyzing(true);
    try {
      const result = await analyzeImage(base64);
      onResult(result);
    } finally {
      setAnalyzing(false);
      setTimeout(() => { autoCaptureDone.current = false; }, 3000);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Indicador de deteção */}
        <div
          className={cn(
            'absolute top-3 right-3 size-4 rounded-full transition-colors duration-300',
            hasClothingDetected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400',
          )}
        />

        {/* Estado do modelo */}
        {!modelReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white text-sm">A carregar modelo TF.js...</span>
          </div>
        )}

        {analyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-sm font-medium">A analisar...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {hasClothingDetected
            ? 'Roupa detetada — captura automática ativa'
            : 'Aponte a câmera para uma peça de roupa'}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCapture}
          disabled={analyzing}
        >
          Capturar agora
        </Button>
      </div>
    </div>
  );
}
