'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { DeviceSelector } from '@/components/custom/device-selector';
import { CameraCapture } from '@/components/custom/camera-capture';
import { VisionResults } from '@/components/custom/vision-results';
import { createDeviceSession } from '@/service/device-session';
import { VisionResult } from '@/app/types/vision';

export default function CameraPage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [, setSessionSaved] = useState(false);

  useEffect(() => {
    setPageTitle('Câmera');
    setBreadcrumbs([
      { label: 'Home', href: '/portal' },
      { label: 'Câmera' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  async function handleDeviceSelect(deviceId: string, deviceLabel: string) {
    setSelectedDeviceId(deviceId);
    setSessionSaved(false);
    try {
      await createDeviceSession({ deviceId, deviceLabel });
      setSessionSaved(true);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <DeviceSelector onSelect={handleDeviceSelect} />

      {selectedDeviceId && (
        <CameraCapture
          deviceId={selectedDeviceId}
          onResult={setVisionResult}
        />
      )}

      {visionResult && <VisionResults result={visionResult} />}
    </div>
  );
}
