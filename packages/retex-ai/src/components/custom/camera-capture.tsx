'use client';

import { useEffect, useState } from 'react';
import { useCamera } from '@/hooks/use-camera';
import { useMotionDetection } from '@/hooks/use-motion-detection';
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
  const { isSettled, state, reset } = useMotionDetection(videoRef, true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (isSettled && !analyzing) {
      handleCapture();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettled]);

  async function handleCapture() {
    const base64 = captureFrame();
    if (!base64) return;
    reset();
    setAnalyzing(true);
    try {
      const result = await analyzeImage(base64);
      onResult(result);
    } finally {
      setAnalyzing(false);
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

        {/* Motion state indicator dot */}
        <div
          className={cn(
            'absolute top-3 right-3 size-4 rounded-full transition-colors duration-300',
            state === 'settled' && 'bg-green-400 shadow-lg shadow-green-400/50',
            state === 'moving' && 'bg-amber-400 shadow-lg shadow-amber-400/50 animate-pulse',
            state === 'idle' && 'bg-gray-400',
          )}
        />

        {analyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-sm font-medium">A analisar...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {analyzing && 'A enviar para análise...'}
          {!analyzing && state === 'idle' && 'Coloque uma peça de roupa à frente da câmera'}
          {!analyzing && state === 'moving' && 'Movimento detetado — aguardar que pare...'}
          {!analyzing && state === 'settled' && 'Peça detetada — captura automática ativa'}
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
