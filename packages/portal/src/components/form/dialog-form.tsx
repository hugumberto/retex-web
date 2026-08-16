'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';

interface DialogFormProps<T extends FieldValues> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  errors: FieldErrors<T>;
  triggerText?: string;
  /** Classes extra no DialogContent (ex.: largura do modal). */
  contentClassName?: string;
}

export function DialogForm<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  trigger,
  children,
  loading = false,
  errors,
  contentClassName,
}: DialogFormProps<T>) {
  const t = useTranslations('common.dialogForm');
  const [internalOpen, setInternalOpen] = React.useState(false);
  // `errors` capturado no closure é o do render anterior à submissão. Sem esta
  // referência, a validação recém-corrida nunca é vista aqui.
  const errorsRef = React.useRef(errors);
  errorsRef.current = errors;
  const isControlled = open !== undefined;

  const resolvedTitle = title ?? t('title');
  const resolvedConfirmText = confirmText ?? t('confirm');
  const resolvedCancelText = cancelText ?? t('cancel');
  const actualOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;

    await onConfirm();

    // Ceder um tick antes de decidir fechar. `onConfirm` é tipicamente o
    // `handleSubmit` do react-hook-form: quando ele resolve, os erros de
    // validação já foram postos no estado do formulário mas o React ainda não
    // voltou a renderizar, pelo que `errorsRef` continuaria a ver o estado
    // anterior — vazio. Sem esta espera, a primeira submissão inválida fechava
    // o diálogo e deitava fora o que o utilizador tinha escrito, sem nunca lhe
    // mostrar o que faltava.
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (!isControlled && Object.keys(errorsRef.current).length === 0) {
      handleOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    handleOpenChange(false);
  };

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent aria-describedby={undefined} className={contentClassName}>
        <DialogHeader>
          <DialogTitle className="text-secondary">{resolvedTitle}</DialogTitle>
          {description && (
            <DialogDescription aria-describedby={undefined}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          {children}
          <DialogFooter className="flex justify-center mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {resolvedCancelText}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} variant={'secondary'}>
              {loading ? t('processing') : resolvedConfirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
