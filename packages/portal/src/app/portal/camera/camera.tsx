'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createDeviceSession } from '@/service/device-session';
import { analyzeImage } from '@/service/vision';
import { VisionLabel, VisionResult, ClothingColor } from '@/app/types/vision';

// ─── Motion detection constants ─────────────────────────────────────────────
const SAMPLE_W = 160;
const SAMPLE_H = 90;
const MOTION_THRESHOLD = 0.015;
const SETTLE_THRESHOLD = 0.004;
const SETTLE_DELAY_MS = 600;

type MotionState = 'idle' | 'moving' | 'settled';

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary"
          style={{ width: `${(score * 100).toFixed(0)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function LabelList({ items }: { items: VisionLabel[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between text-sm">
          <span className="capitalize">{item.description}</span>
          <ScoreBar score={item.score} />
        </li>
      ))}
    </ul>
  );
}

function ResultSection({
  title,
  items,
  highlight,
}: {
  title: string;
  items: VisionLabel[];
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn('space-y-2', highlight && 'rounded-lg border bg-muted/40 p-3')}>
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          highlight && 'text-foreground',
        )}
      >
        {title}
      </p>
      <LabelList items={items} />
    </div>
  );
}

function ColorSwatches({ colors }: { colors: ClothingColor[] }) {
  if (colors.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Cores dominantes
      </p>
      <div className="flex gap-2 flex-wrap">
        {colors.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="size-8 rounded-md border shadow-sm"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
            <span className="text-[10px] text-muted-foreground">
              {(c.pixelFraction * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Camera() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  // Device selection
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedRadio, setSelectedRadio] = useState<string>('');
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // Camera stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Motion detection
  const prevDataRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadMotionRef = useRef(false);
  const [motionState, setMotionState] = useState<MotionState>('idle');

  // Analysis
  const analyzingRef = useRef(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);

  // ── Page metadata ────────────────────────────────────────────────────────
  useEffect(() => {
    setPageTitle('Câmera');
    setBreadcrumbs([
      { label: 'Home', href: '/portal' },
      { label: 'Câmera' },
    ]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs]);

  // ── Enumerate cameras ────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((all) => {
        const cameras = all.filter((d) => d.kind === 'videoinput');
        setDevices(cameras);
        if (cameras.length > 0) setSelectedRadio(cameras[0].deviceId);
      })
      .catch(() => {});
  }, []);

  // ── Start camera stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeDeviceId) return;
    let active = true;

    async function start() {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: activeDeviceId! } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('Não foi possível aceder à câmera. Verifique as permissões.');
      }
    }

    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [activeDeviceId]);

  // ── Motion detection loop ────────────────────────────────────────────────
  const resetMotion = useCallback(() => {
    setMotionState('idle');
    hadMotionRef.current = false;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!activeDeviceId) return;

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_W;
    canvas.height = SAMPLE_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    function tick() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx!.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
      const current = ctx!.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;

      if (prevDataRef.current) {
        let diff = 0;
        for (let i = 0; i < current.length; i += 4) {
          diff += Math.abs(current[i] - prevDataRef.current[i]);
        }
        const score = diff / (SAMPLE_W * SAMPLE_H * 255);

        if (score > MOTION_THRESHOLD) {
          hadMotionRef.current = true;
          if (settleTimerRef.current) {
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
          }
          setMotionState('moving');
        } else if (hadMotionRef.current && score < SETTLE_THRESHOLD) {
          if (!settleTimerRef.current) {
            settleTimerRef.current = setTimeout(() => {
              setMotionState('settled');
              settleTimerRef.current = null;
            }, SETTLE_DELAY_MS);
          }
        }
      }

      prevDataRef.current = new Uint8ClampedArray(current);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      prevDataRef.current = null;
    };
  }, [activeDeviceId]);

  // ── Auto-capture when settled ────────────────────────────────────────────
  useEffect(() => {
    if (motionState === 'settled' && !analyzingRef.current) {
      handleCapture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionState]);

  // ── Capture & analyze ────────────────────────────────────────────────────
  function captureFrame(): string | null {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  }

  async function handleCapture() {
    const base64 = captureFrame();
    if (!base64) return;
    resetMotion();
    analyzingRef.current = true;
    setAnalyzing(true);
    try {
      const result = await analyzeImage(base64);
      setVisionResult(result);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }

  // ── Select device ────────────────────────────────────────────────────────
  async function handleDeviceConfirm() {
    const device = devices.find((d) => d.deviceId === selectedRadio);
    if (!device) return;
    setActiveDeviceId(device.deviceId);
    setVisionResult(null);
    try {
      await createDeviceSession({
        deviceId: device.deviceId,
        deviceLabel: device.label || `Câmera ${devices.indexOf(device) + 1}`,
      });
    } catch {}
  }

  // ── Derived values for results ───────────────────────────────────────────
  const hasClothing = visionResult
    ? visionResult.clothing.types.length > 0 ||
      visionResult.clothing.materials.length > 0 ||
      visionResult.clothing.styles.length > 0 ||
      visionResult.clothing.patterns.length > 0
    : false;

  const otherLabels = visionResult
    ? (() => {
        const classified = new Set(
          [
            ...visionResult.clothing.types,
            ...visionResult.clothing.materials,
            ...visionResult.clothing.styles,
            ...visionResult.clothing.patterns,
            ...visionResult.objects,
          ].map((l) => l.description.toLowerCase()),
        );
        return visionResult.labels.filter(
          (l) => !classified.has(l.description.toLowerCase()),
        );
      })()
    : [];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <section id="camera-page" className="flex flex-col gap-6">
      {/* Device selector */}
      {devices.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Nenhuma câmera encontrada. Verifique as permissões do browser.
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Selecionar câmera</p>
          <div className="space-y-2">
            {devices.map((device, i) => (
              <label key={device.deviceId} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="camera"
                  value={device.deviceId}
                  checked={selectedRadio === device.deviceId}
                  onChange={() => setSelectedRadio(device.deviceId)}
                  className="accent-secondary"
                />
                <span className="text-sm">{device.label || `Câmera ${i + 1}`}</span>
              </label>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDeviceConfirm}
            disabled={!selectedRadio}
          >
            Usar esta câmera
          </Button>
        </div>
      )}

      {/* Camera feed */}
      {activeDeviceId && (
        <>
          {cameraError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {cameraError}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div
                  className={cn(
                    'absolute top-3 right-3 size-4 rounded-full transition-colors duration-300',
                    motionState === 'settled' && 'bg-green-400 shadow-lg shadow-green-400/50',
                    motionState === 'moving' &&
                      'bg-amber-400 shadow-lg shadow-amber-400/50 animate-pulse',
                    motionState === 'idle' && 'bg-gray-400',
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
                  {!analyzing &&
                    motionState === 'idle' &&
                    'Coloque uma peça de roupa à frente da câmera'}
                  {!analyzing &&
                    motionState === 'moving' &&
                    'Movimento detetado — aguardar que pare...'}
                  {!analyzing &&
                    motionState === 'settled' &&
                    'Peça detetada — captura automática ativa'}
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
          )}
        </>
      )}

      {/* Vision results */}
      {visionResult && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Resultado da identificação</h3>

          <ColorSwatches colors={visionResult.colors} />

          {hasClothing ? (
            <>
              <ResultSection title="Tipo de peça" items={visionResult.clothing.types} highlight />
              <ResultSection title="Material" items={visionResult.clothing.materials} />
              <ResultSection title="Estilo" items={visionResult.clothing.styles} />
              <ResultSection title="Padrão" items={visionResult.clothing.patterns} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma peça de roupa identificada nas categorias conhecidas.
            </p>
          )}

          {otherLabels.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground transition-colors">
                Ver todos os resultados ({otherLabels.length + visionResult.objects.length})
              </summary>
              <div className="mt-2 space-y-1">
                <LabelList
                  items={[...visionResult.objects, ...otherLabels].sort(
                    (a, b) => b.score - a.score,
                  )}
                />
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
