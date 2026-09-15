import * as React from 'react';

export type QrScannerError =
  | 'insecure-context'
  | 'unsupported'
  | 'permission-denied'
  | 'no-camera'
  | 'camera-busy'
  | 'decoder-failed'
  | 'unknown';

export type QrScannerStatus = 'idle' | 'starting' | 'running' | 'error';

/** Lado do quadrado que é descodificado — o mesmo que a mira mostra. */
const ROI_SIZE = 480;
/** ~10 descodificações por segundo. Mais do que isto só aquece o telemóvel. */
const DECODE_INTERVAL_MS = 100;
/** Janela em que o mesmo código é ignorado (a câmara lê o mesmo frame em rajada). */
const DEDUPE_MS = 1500;

function mapCameraError(error: unknown): QrScannerError {
  switch ((error as { name?: string })?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'permission-denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera';
    case 'NotReadableError':
    case 'TrackStartError':
      // Outra aplicação tem a câmara presa.
      return 'camera-busy';
    default:
      return 'unknown';
  }
}

export interface UseQrScannerOptions {
  /** Liga a câmara. Espelha o `open` do diálogo. */
  active: boolean;
  /** Recebe o código lido, já trimado e desduplicado. */
  onDecode: (code: string) => void;
}

/**
 * Câmara + descodificação de QR, sem UI.
 *
 * O `jsqr` é carregado por `import()` dentro do arranque: o descodificador só é
 * descarregado na primeira vez que alguém abre a câmara, e não pesa no bundle
 * das páginas.
 *
 * A regra que não se pode quebrar é largar a câmara: ao fechar, ao desmontar e
 * ao mandar a app para segundo plano. Um telemóvel que fica com a câmara presa
 * um turno inteiro aquece e come a bateria, e é uma falha que não se vê em
 * desenvolvimento.
 */
export function useQrScanner({ active, onDecode }: UseQrScannerOptions) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const lastDecodedRef = React.useRef<{ code: string; at: number } | null>(null);

  // O callback vive numa ref para que mudar de identidade entre renders não
  // reinicie a câmara (reiniciar pisca a imagem e volta a pedir permissão).
  const onDecodeRef = React.useRef(onDecode);
  React.useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const [status, setStatus] = React.useState<QrScannerStatus>('idle');
  const [error, setError] = React.useState<QrScannerError | null>(null);
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);
  // Incrementar força o efeito a correr de novo: é o "tentar outra vez" e a
  // retoma depois de a app voltar do segundo plano.
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    let decode: typeof import('jsqr').default | null = null;
    let lastDecodeAt = 0;

    const releaseCamera = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setTorchOn(false);
      setTorchSupported(false);
    };

    const loop = (now: number) => {
      frameRef.current = requestAnimationFrame(loop);

      if (now - lastDecodeAt < DECODE_INTERVAL_MS) return;
      lastDecodeAt = now;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;

      const canvas = (canvasRef.current ??= document.createElement('canvas'));
      canvas.width = ROI_SIZE;
      canvas.height = ROI_SIZE;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      // Só o quadrado central do vídeo. Mantém o custo por frame constante,
      // seja qual for a resolução que a câmara entregar.
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sourceX = (video.videoWidth - side) / 2;
      const sourceY = (video.videoHeight - side) / 2;
      context.drawImage(
        video,
        sourceX,
        sourceY,
        side,
        side,
        0,
        0,
        ROI_SIZE,
        ROI_SIZE
      );

      const image = context.getImageData(0, 0, ROI_SIZE, ROI_SIZE);
      // As etiquetas são pretas sobre branco; não tentar a versão invertida
      // corta quase metade do tempo de descodificação.
      const result = decode?.(image.data, ROI_SIZE, ROI_SIZE, {
        inversionAttempts: 'dontInvert',
      });

      const code = result?.data?.trim();
      if (!code) return;

      const previous = lastDecodedRef.current;
      if (previous && previous.code === code && now - previous.at < DEDUPE_MS) {
        return;
      }
      lastDecodedRef.current = { code, at: now };
      onDecodeRef.current(code);
    };

    const start = async () => {
      setError(null);
      setStatus('starting');

      // `getUserMedia` só existe em contexto seguro. Sem esta distinção, testar
      // no telemóvel por IP da rede local dá um ecrã preto sem explicação.
      if (!window.isSecureContext) {
        setError('insecure-context');
        setStatus('error');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('unsupported');
        setStatus('error');
        return;
      }

      try {
        decode = (await import('jsqr')).default;
      } catch {
        // Primeira leitura sem rede: o chunk do descodificador não está em cache.
        if (!cancelled) {
          setError('decoder-failed');
          setStatus('error');
        }
        return;
      }
      if (cancelled) return;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // `ideal` e não `exact`: com `exact`, um portátil sem câmara traseira
          // rebenta com OverconstrainedError em vez de usar a que tem.
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (cameraError) {
        if (!cancelled) {
          setError(mapCameraError(cameraError));
          setStatus('error');
        }
        return;
      }

      if (cancelled || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        // O iOS rejeita o play em alguns arranques; o loop aguenta e o vídeo
        // acaba por arrancar sozinho.
      }
      if (cancelled) return;

      // `torch` ainda não está nos tipos do DOM — existe no Android Chrome.
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      setTorchSupported(capabilities?.torch === true);

      setStatus('running');
      frameRef.current = requestAnimationFrame(loop);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        releaseCamera();
        setStatus('idle');
        return;
      }
      // O iOS mata a track em segundo plano; sem reiniciar, o utilizador volta
      // a um ecrã preto.
      setAttempt((value) => value + 1);
    };

    start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', releaseCamera);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', releaseCamera);
      releaseCamera();
    };
  }, [active, attempt]);

  const toggleTorch = React.useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    track
      .applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints)
      .then(() => setTorchOn(next))
      .catch(() => undefined);
  }, [torchOn]);

  const retry = React.useCallback(() => setAttempt((value) => value + 1), []);

  return {
    videoRef,
    status,
    error,
    retry,
    torch: { supported: torchSupported, on: torchOn, toggle: toggleTorch },
  };
}
