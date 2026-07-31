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
import { useTranslations } from 'next-intl';

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
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  open,
  onOpenChange,
  disabled,
  contentClassName = 'sm:max-w-[425px]',
  actionClassName,
  cancelClassName,
}: ConfirmDialogProps) {
  const t = useTranslations('common.confirmDialog');
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);

  const resolvedTitle = title ?? t('title');
  const resolvedDescription = description ?? t('description');
  const resolvedConfirmText = confirmText ?? t('confirm');
  const resolvedCancelText = cancelText ?? t('cancel');

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
              {resolvedConfirmText}
            </Button>
          )}
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {resolvedTitle}
          </AlertDialogTitle>
          {resolvedDescription ? (
            <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className={cancelClassName}>
            {resolvedCancelText}
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} className={actionClassName}>
              {resolvedConfirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
