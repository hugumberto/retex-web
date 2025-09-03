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

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];

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
  /** Confirm button variant (shadcn). */
  variant?: ButtonVariant;
  /** Optional icon next to the title. */
  icon?: React.ReactNode;

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
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
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
  const [loading, setLoading] = React.useState(false);

  const actualOpen = isControlled ? open ?? false : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    if (!onConfirm) {
      setOpen(false);
      return;
    }
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={actualOpen} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <span className={disabled ? 'pointer-events-none opacity-60' : ''}>
          {trigger ?? (
            <Button variant={variant} disabled={disabled}>
              {confirmText}
            </Button>
          )}
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className={cancelClassName} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>

          {/* Uses your <Button /> classes/variant for the confirm button */}
          <AlertDialogAction asChild>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant={variant}
              className={actionClassName}
            >
              {loading ? 'Processing...' : confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
