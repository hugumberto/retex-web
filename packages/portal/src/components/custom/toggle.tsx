'use client';

import { cn } from '@/lib/utils';

/** Interruptor (ligado/desligado) do design do backoffice. */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-teal' : 'bg-[#d5e0e4]'
      )}
    >
      <span
        className={cn(
          'inline-block size-[18px] rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  );
}
