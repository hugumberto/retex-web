'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsStandalone } from '@/hooks/use-standalone';
import { cn } from '@/lib/utils';
import { ScanLine } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import * as React from 'react';

// Fora do bundle das páginas: o leitor e o descodificador só chegam ao
// dispositivo de quem abre mesmo a câmara.
const QrScannerDialog = dynamic(() => import('./qr-scanner-dialog'), {
  ssr: false,
});

export interface ScanInputProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Chamado com o código, venha ele do leitor físico (Enter/blur) ou da câmara.
   * O valor vai **cru**: o token dos sacos é hexadecimal minúsculo e qualquer
   * normalização a maiúsculas parte a correspondência.
   */
  onScan: (code: string) => void | Promise<void>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Submete também ao perder o foco (o comportamento de hoje em alguns ecrãs). */
  submitOnBlur?: boolean;
  /** Devolve o foco ao input ao fechar a câmara. Ligado por omissão. */
  focusOnClose?: boolean;
  scanTitle?: string;
  scanHint?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * Classes do contentor. É aqui que vai a largura (`max-w-md`, …): o input é
   * um flex item que preenche o espaço que sobra do botão.
   */
  className?: string;
  /** Classes do próprio input, para casos que fujam à regra. */
  inputClassName?: string;
}

/**
 * Campo de código que serve os dois leitores: o scanner físico, que escreve e
 * envia Enter, e a câmara do telemóvel.
 *
 * O botão da câmara só aparece em modo app (ver `useIsStandalone`) e quando o
 * dispositivo tem mesmo câmara — no posto de trabalho com leitor físico, este
 * componente renderiza exatamente o que se via antes.
 */
export default function ScanInput({
  value,
  onChange,
  onScan,
  inputRef,
  submitOnBlur = false,
  focusOnClose = true,
  scanTitle,
  scanHint,
  placeholder,
  disabled,
  autoFocus,
  className,
  inputClassName,
}: ScanInputProps) {
  const t = useTranslations('common.scanner');
  const isStandalone = useIsStandalone();
  const [hasCamera, setHasCamera] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const fallbackRef = React.useRef<HTMLInputElement>(null);
  const resolvedRef = inputRef ?? fallbackRef;

  // Depois de montar, nunca durante o render: no servidor não há `navigator` e
  // decidir aqui provocava um mismatch de hidratação.
  React.useEffect(() => {
    setHasCamera(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const showScanner = isStandalone && hasCamera;

  const handleScanned = (code: string) => {
    onChange(code);
    onScan(code);
  };

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      <Input
        ref={resolvedRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          // Clicar no botão da câmara tira o foco ao input. Sem esta guarda, o
          // ecrã submetia o texto parcial e mostrava um "não encontrado" falso.
          if (!submitOnBlur || scannerOpen) return;
          onScan(value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onScan(value);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn('flex-1', inputClassName)}
      />

      {showScanner && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={disabled}
          title={t('open')}
          aria-label={t('open')}
          // Segura o foco no input; o `onBlur` acima é a segunda rede.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-4" />
        </Button>
      )}

      {showScanner && (
        <QrScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleScanned}
          title={scanTitle}
          hint={scanHint}
          onCloseAutoFocus={(event) => {
            if (!focusOnClose) return;
            // Por omissão o Radix devolve o foco ao botão que abriu o diálogo,
            // e o ciclo do leitor físico morria a seguir à primeira leitura.
            event.preventDefault();
            resolvedRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
