import { useEffect, useRef, useState } from 'react';

export function useCamera(deviceId: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    let active = true;

    async function startCamera() {
      try {
        if (stream) stream.getTracks().forEach((t) => t.stop());

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });

        if (!active) { newStream.getTracks().forEach((t) => t.stop()); return; }

        setStream(newStream);
        setError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play();
        }
      } catch {
        setError('Não foi possível aceder à câmera. Verifique as permissões.');
      }
    }

    startCamera();

    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [deviceId]);

  function captureFrame(): string | null {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  }

  return { videoRef, error, captureFrame };
}
