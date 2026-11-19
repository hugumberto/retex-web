'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { buttonClass } from './ui';

export const PROFILES = ['particular', 'empresa', 'municipio', 'outro'] as const;
type ContactProfile = (typeof PROFILES)[number];

type Values = {
  name: string;
  phone: string;
  email: string;
  profile: ContactProfile;
  message: string;
};

export const fieldClass = (invalid?: boolean) =>
  cn(
    'h-12 w-full rounded-[10px] border bg-white px-4 text-sm text-navy placeholder:text-[#757575] focus:outline-none focus:ring-2 focus:ring-teal/30',
    invalid ? 'border-red-500' : 'border-field focus:border-teal'
  );

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className="text-[13px] font-medium text-navy">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const isProfile = (value: string | null): value is ContactProfile =>
  !!value && (PROFILES as readonly string[]).includes(value);

/**
 * "Fala connosco". Os botões de empresa/município da página trazem
 * `?perfil=…#contacto`, e o campo "Sou" já vem escolhido.
 */
export default function HomeContactForm() {
  const t = useTranslations('home.contact');
  const tValidation = useTranslations('validation');
  const searchParams = useSearchParams();
  const perfil = searchParams.get('perfil');
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      profile: 'particular',
      message: '',
    },
  });

  useEffect(() => {
    if (isProfile(perfil)) setValue('profile', perfil);
  }, [perfil, setValue]);

  const onSubmit = async (data: Values) => {
    setFeedback(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          // A API pede um título; o perfil é o que distingue os pedidos.
          title: t('subject', { profile: t(`profiles.${data.profile}`) }),
          message: data.message,
        }),
      });
      if (!res.ok) throw new Error();
      reset({ ...data, name: '', phone: '', email: '', message: '' });
      setFeedback({ tone: 'success', text: t('success') });
    } catch {
      setFeedback({ tone: 'error', text: t('error') });
    }
  };

  const required = { required: tValidation('required') };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-4 rounded-[20px] bg-panel p-6 sm:p-9 lg:max-w-[532px]"
    >
      <h2 className="text-2xl font-bold tracking-[-0.01em] text-navy">
        {t('title')}
      </h2>
      <p className="text-sm leading-[22px] text-ink">{t('description')}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('fields.name')} error={errors.name?.message}>
          <input
            autoComplete="name"
            className={fieldClass(!!errors.name)}
            aria-invalid={errors.name ? true : undefined}
            {...register('name', required)}
          />
        </Field>
        <Field label={t('fields.phone')} error={errors.phone?.message}>
          <input
            type="tel"
            autoComplete="tel"
            className={fieldClass(!!errors.phone)}
            aria-invalid={errors.phone ? true : undefined}
            {...register('phone', required)}
          />
        </Field>
      </div>

      <Field label={t('fields.email')} error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          className={fieldClass(!!errors.email)}
          aria-invalid={errors.email ? true : undefined}
          {...register('email', {
            ...required,
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: tValidation('invalidEmail'),
            },
          })}
        />
      </Field>

      <Field label={t('fields.profile')}>
        <select className={fieldClass()} {...register('profile')}>
          {PROFILES.map((profile) => (
            <option key={profile} value={profile}>
              {t(`profiles.${profile}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('fields.message')} error={errors.message?.message}>
        <textarea
          rows={4}
          className={cn(fieldClass(!!errors.message), 'h-[118px] resize-y py-3')}
          aria-invalid={errors.message ? true : undefined}
          {...register('message', required)}
        />
      </Field>

      {feedback ? (
        <p
          role="status"
          className={cn(
            'rounded-[10px] px-4 py-3 text-sm',
            feedback.tone === 'success'
              ? 'bg-mint text-forest'
              : 'bg-red-50 text-red-700'
          )}
        >
          {feedback.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn('self-start', buttonClass('primary'))}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
