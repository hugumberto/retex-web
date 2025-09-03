'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type ConfirmDialogProps = {
  /** Element that opens the dialog (e.g.: <Button />). */
  trigger?: React.ReactNode;
  /** Dialog title. */
  title?: React.ReactNode;
  /** Dialog description. */
  description?: React.ReactNode;
  /** Confirm button text. */
  confirmText?: string;
  /** Cancel button text. */
  cancelText?: string;

  /** Called on confirm. If returns a Promise, will await with loading. */
  onConfirm?: () => void | Promise<void>;

  /** Controlled (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Disables the trigger. */
  disabled?: boolean;

  /** Custom class names */
  contentClassName?: string;
  actionClassName?: string;
  cancelClassName?: string;
};

export default function ConfirmDialog({
  trigger,
  title = 'Deseja continuar?',
  description = 'Esta ação é irreversível.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  open,
  onOpenChange,
  disabled,
  contentClassName = 'sm:max-w-[425px]',
  actionClassName,
  cancelClassName,
}: ConfirmDialogProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);

  const actualOpen = isControlled ? Boolean(open) : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = () => {
    if (!onConfirm) {
      setOpen(false);
      return;
    }

    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={actualOpen} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <span className={disabled ? 'pointer-events-none opacity-60' : ''}>
          {trigger ?? (
            <Button variant={'ghost'} disabled={disabled}>
              {confirmText}
            </Button>
          )}
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className={cancelClassName}>
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} className={actionClassName}>
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
