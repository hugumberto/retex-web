'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrScannerError, useQrScanner } from '@/hooks/use-qr-scanner';
import { Flashlight, FlashlightOff, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

const ERROR_KEY: Record<QrScannerError, string> = {
  'insecure-context': 'errorInsecureContext',
  unsupported: 'errorUnsupported',
  'permission-denied': 'errorPermissionDenied',
  'no-camera': 'errorNoCamera',
  'camera-busy': 'errorCameraBusy',
  'decoder-failed': 'errorDecoderFailed',
  unknown: 'errorUnknown',
};

export interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recebe o código lido. O diálogo fecha-se antes de chamar. */
  onScan: (code: string) => void;
  title?: string;
  hint?: string;
  /** Para devolver o foco ao input em vez de ao botão que abriu o diálogo. */
  onCloseAutoFocus?: (event: Event) => void;
}

export default function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
  title,
  hint,
  onCloseAutoFocus,
}: QrScannerDialogProps) {
  const t = useTranslations('common.scanner');

  // Uma leitura por abertura. Sem isto, o frame seguinte chega antes de o
  // diálogo desmontar e o código é entregue duas vezes.
  const handledRef = React.useRef(false);
  React.useEffect(() => {
    if (open) handledRef.current = false;
  }, [open]);

  const handleDecode = React.useCallback(
    (code: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      onOpenChange(false);
      onScan(code);
    },
    [onOpenChange, onScan]
  );

  const { videoRef, status, error, retry, torch } = useQrScanner({
    active: open,
    onDecode: handleDecode,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle className="text-secondary">
            {title ?? t('title')}
          </DialogTitle>
          <DialogDescription>{hint ?? t('hint')}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          {/* `playsInline` e `muted` não são opcionais: sem eles o iOS abre o
              vídeo em fullscreen nativo ou bloqueia o arranque. */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />

          {status === 'running' && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="h-3/5 w-3/5 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}

          {status === 'starting' && (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white">
              {t('starting')}
            </p>
          )}

          {status === 'error' && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm font-medium text-white">
                {t(ERROR_KEY[error])}
              </p>
              {error === 'permission-denied' && (
                <p className="text-xs text-white/80">{t('errorPermissionHint')}</p>
              )}
              <p className="text-xs text-white/80">{t('manualFallback')}</p>
              <Button type="button" variant="secondary" size="sm" onClick={retry}>
                <RefreshCw className="size-4" />
                {t('retry')}
              </Button>
            </div>
          )}
        </div>

        {torch.supported && status === 'running' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={torch.toggle}
          >
            {torch.on ? (
              <FlashlightOff className="size-4" />
            ) : (
              <Flashlight className="size-4" />
            )}
            {torch.on ? t('torchOff') : t('torchOn')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
