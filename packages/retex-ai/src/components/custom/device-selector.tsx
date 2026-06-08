'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface DeviceSelectorProps {
  onSelect: (deviceId: string, deviceLabel: string) => void;
}

export function DeviceSelector({ onSelect }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((allDevices) => {
        const cameras = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(cameras);
        if (cameras.length > 0) setSelected(cameras[0].deviceId);
      })
      .catch(() => {});
  }, []);

  function handleConfirm() {
    const device = devices.find((d) => d.deviceId === selected);
    if (device) onSelect(device.deviceId, device.label || `Câmera ${devices.indexOf(device) + 1}`);
  }

  if (!devices.length) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Nenhuma câmera encontrada. Verifique as permissões do browser.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Label className="text-sm font-semibold">Selecionar câmera</Label>
      <div className="space-y-2">
        {devices.map((device, i) => (
          <label key={device.deviceId} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="camera"
              value={device.deviceId}
              checked={selected === device.deviceId}
              onChange={() => setSelected(device.deviceId)}
              className="accent-secondary"
            />
            <span className="text-sm">{device.label || `Câmera ${i + 1}`}</span>
          </label>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleConfirm}
        disabled={!selected}
      >
        Usar esta câmera
      </Button>
    </div>
  );
}
