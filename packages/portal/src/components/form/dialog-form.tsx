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
}

export function DialogForm<T extends FieldValues>({
  open,
  onOpenChange,
  title = 'Confirmar ação',
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  trigger,
  children,
  loading = false,
  errors, 
}: DialogFormProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
      if (Object.keys(errors).length === 0) {
        handleOpenChange(false);
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    handleOpenChange(false);
  };

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-secondary">{title}</DialogTitle>
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
                {cancelText}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} variant={'secondary'}>
              {loading ? 'Processando...' : confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
