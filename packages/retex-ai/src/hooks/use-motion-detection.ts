import { useCallback, useEffect, useRef, useState } from 'react';

// Sample at low resolution for performance
const SAMPLE_W = 160;
const SAMPLE_H = 90;

// Score = mean absolute diff per pixel, normalised to [0, 1]
const MOTION_THRESHOLD = 0.015; // >1.5% change → item being moved/placed
const SETTLE_THRESHOLD = 0.004; // <0.4% change → item is still
const SETTLE_DELAY_MS = 600;    // must be still for 600ms before triggering

export type MotionState = 'idle' | 'moving' | 'settled';

export function useMotionDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const prevDataRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadMotionRef = useRef(false);

  const [motionScore, setMotionScore] = useState(0);
  const [state, setState] = useState<MotionState>('idle');

  const reset = useCallback(() => {
    setState('idle');
    hadMotionRef.current = false;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

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
          // red channel only — fast and sufficient for motion
          diff += Math.abs(current[i] - prevDataRef.current[i]);
        }
        const score = diff / (SAMPLE_W * SAMPLE_H * 255);
        setMotionScore(score);

        if (score > MOTION_THRESHOLD) {
          hadMotionRef.current = true;
          // cancel any pending settle timer when motion resumes
          if (settleTimerRef.current) {
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
          }
          setState('moving');
        } else if (hadMotionRef.current && score < SETTLE_THRESHOLD) {
          // item stopped — start settle countdown
          if (!settleTimerRef.current) {
            settleTimerRef.current = setTimeout(() => {
              setState('settled');
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
  }, [enabled, videoRef]);

  return {
    motionScore,
    isMoving: state === 'moving',
    isSettled: state === 'settled',
    state,
    reset,
  };
}
