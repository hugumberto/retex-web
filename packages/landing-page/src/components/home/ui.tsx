import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Peças comuns da landing (Figma "Portal" → 01-Main). A grelha do design é de
 * 1440 px com 138 px de margem, ou seja, um contentor de 1164 px.
 */
export function Section({
  id,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 px-4 sm:px-8', className)}>
      <div className={cn('mx-auto w-full max-w-[1164px]', innerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Rótulo técnico em DM Mono por cima dos títulos ("RECOLHA SELETIVA…"). */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] uppercase tracking-[0.1em] text-teal',
        className
      )}
    >
      {children}
    </p>
  );
}

type ButtonVariant = 'primary' | 'white' | 'outline-white' | 'outline';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:opacity-90',
  white: 'bg-white text-navy hover:bg-white/90',
  // O contorno do design tem 48 px de altura, 4 px a mais do que os outros.
  'outline-white': 'h-12 border border-white px-6 text-white hover:bg-white/10',
  outline: 'border border-navy bg-white text-navy hover:bg-mist',
};

/** Classes de botão em pílula; servem para <a>, <Link> e <button>. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: 'md' | 'lg' = 'md'
) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    size === 'md' ? 'h-11 px-[22px] text-sm' : 'h-[54px] px-8 text-[15px]',
    VARIANTS[variant]
  );
}

/** Lista com o visto dos cartões de perfil. */
export function CheckList({
  items,
  tone = 'dark',
}: {
  items: string[];
  tone?: 'dark' | 'light';
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            'flex items-center gap-2 text-[13px]',
            tone === 'dark' ? 'text-navy' : 'text-white'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              tone === 'dark'
                ? '/assets/landing/check-navy.svg'
                : '/assets/landing/check-branco.svg'
            }
            alt=""
            width={10.5}
            height={8}
            className="shrink-0"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
