'use client';

import { Link } from '@/i18n/navigation';
import { getPortalLoginHref } from '@/lib/portal';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Field, fieldClass } from '../home/HomeContactForm';
import { buttonClass } from '../home/ui';
import { firstAddressPart } from '../../utils/address';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  zipCode: string;
  street: string;
  city: string;
  cityDivision: string;
  country: string;
  countryDivision: string;
  lat: string;
  long: string;
  consent: boolean;
};

const EMPTY: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  contactPhone: '',
  zipCode: '',
  street: '',
  city: '',
  cityDivision: '',
  country: '',
  countryDivision: '',
  lat: '',
  long: '',
  consent: false,
};

const PRIVACY_URL = 'https://www.iubenda.com/privacy-policy/50808874';

/**
 * Registo de particulares (Figma "Portal" → 02-Registo). Empresas e municípios
 * ainda não se registam sozinhos: os separadores levam ao contacto.
 *
 * Fica de fora do design, de propósito:
 * - a palavra-passe: o fluxo atual envia um email para a definir e ativar a
 *   conta, e mudar isso é outra decisão;
 * - "Continuar com Google": a API ainda não tem login Google.
 */
export default function RegistrationForm() {
  const t = useTranslations('register');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: 'onTouched', defaultValues: EMPTY });
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  // Localidade e freguesia vêm do código postal (TomTom). Só aparecem depois
  // dele, para o caso de a TomTom não as devolver e ser preciso escrevê-las.
  const showLocality = watch('zipCode').trim().length > 0;

  const handleBlurZipCode = async (e: React.FocusEvent<HTMLInputElement>) => {
    const postalCode = e.target.value.trim();
    if (!postalCode) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${postalCode}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
      );
      if (!res.ok) return;
      const { results } = await res.json();
      if (!Array.isArray(results) || results.length === 0) return;
      const { address: addr, position } = results[0];
      setValue('city', firstAddressPart(addr?.municipality));
      setValue('cityDivision', firstAddressPart(addr?.municipalitySubdivision));
      setValue(
        'countryDivision',
        firstAddressPart(
          addr?.countrySecondarySubdivision ?? addr?.countrySubdivision
        )
      );
      setValue('country', addr?.country ?? '');
      setValue('lat', position?.lat ? String(position.lat) : '');
      setValue('long', position?.lon ? String(position.lon) : '');
    } catch {
      // silencioso — o utilizador pode preencher à mão
    }
  };

  const onSubmit = async (data: FormValues) => {
    setFeedback(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}user/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': locale,
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            contactPhone: data.contactPhone,
            // Idioma em que o utilizador se registou: é o que a API usa para
            // lhe enviar emails daqui em diante.
            language: locale,
            address: {
              zipCode: data.zipCode,
              street: data.street,
              city: data.city || undefined,
              cityDivision: data.cityDivision || undefined,
              country: data.country || undefined,
              countryDivision: data.countryDivision || undefined,
              lat: data.lat || undefined,
              long: data.long || undefined,
            },
          }),
        }
      );
      if (res.status === 409) {
        setFeedback({ tone: 'error', text: t('feedback.duplicateEmail') });
        return;
      }
      if (!res.ok) throw new Error();
      const body = await res.json().catch(() => null);
      setFeedback({
        tone: 'success',
        text: body?.inServiceZone
          ? t('feedback.successInZone')
          : t('feedback.successOutOfZone'),
      });
      reset(EMPTY);
    } catch {
      setFeedback({ tone: 'error', text: t('feedback.error') });
    }
  };

  const required = { required: tValidation('required') };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full max-w-[520px] flex-col gap-[18px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[31px] font-semibold tracking-[-0.02em] text-navy">
          {t('title')}
        </h1>
        <p className="text-[13px] text-ink">
          {t('alreadyHaveAccount')}{' '}
          <a
            href={getPortalLoginHref()}
            className="font-semibold text-teal underline underline-offset-2"
          >
            {t('login')}
          </a>
        </p>
      </div>

      <div
        role="tablist"
        aria-label={t('accountType.label')}
        className="flex rounded-xl bg-line p-[5px] text-[13px]"
      >
        <span
          role="tab"
          aria-selected="true"
          className="flex h-10 flex-1 items-center justify-center rounded-[9px] bg-white font-semibold text-navy shadow-[0_1px_3px_rgba(1,51,100,0.08)]"
        >
          {t('accountType.individual')}
        </span>
        {(['empresa', 'municipio'] as const).map((profile) => (
          <Link
            key={profile}
            role="tab"
            aria-selected="false"
            href={`/?perfil=${profile}#contacto`}
            className="flex h-10 flex-1 items-center justify-center rounded-[9px] text-ink hover:text-navy"
          >
            {t(`accountType.${profile}`)}
          </Link>
        ))}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={t('fields.firstName')} error={errors.firstName?.message}>
          <input
            autoComplete="given-name"
            className={fieldClass(!!errors.firstName)}
            aria-invalid={errors.firstName ? true : undefined}
            {...register('firstName', required)}
          />
        </Field>
        <Field label={t('fields.lastName')} error={errors.lastName?.message}>
          <input
            autoComplete="family-name"
            className={fieldClass(!!errors.lastName)}
            aria-invalid={errors.lastName ? true : undefined}
            {...register('lastName', required)}
          />
        </Field>
      </div>

      <Field label={t('fields.email')} error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          placeholder={t('fields.emailPlaceholder')}
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

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={t('fields.phone')} error={errors.contactPhone?.message}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="9XX XXX XXX"
            className={fieldClass(!!errors.contactPhone)}
            aria-invalid={errors.contactPhone ? true : undefined}
            {...register('contactPhone', required)}
          />
        </Field>
        <Field label={t('fields.zipCode')} error={errors.zipCode?.message}>
          <input
            autoComplete="postal-code"
            placeholder={t('fields.zipCodePlaceholder')}
            className={fieldClass(!!errors.zipCode)}
            aria-invalid={errors.zipCode ? true : undefined}
            {...register('zipCode', { ...required, onBlur: handleBlurZipCode })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Field label={t('fields.street')} error={errors.street?.message}>
          <input
            autoComplete="street-address"
            placeholder={t('fields.streetPlaceholder')}
            className={fieldClass(!!errors.street)}
            aria-invalid={errors.street ? true : undefined}
            {...register('street', required)}
          />
        </Field>
        <p className="font-mono text-[11px] text-ink">{t('addressHint')}</p>
      </div>

      {showLocality ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label={t('fields.city')}>
            <input className={fieldClass()} {...register('city')} />
          </Field>
          <Field label={t('fields.cityDivision')}>
            <input className={fieldClass()} {...register('cityDivision')} />
          </Field>
        </div>
      ) : null}

      <label className="flex items-start gap-3 text-[13px] leading-5 text-ink">
        <input
          type="checkbox"
          className="mt-0.5 size-[18px] shrink-0 accent-teal"
          aria-invalid={errors.consent ? true : undefined}
          {...register('consent', { required: tValidation('required') })}
        />
        <span>
          {t.rich('consent', {
            privacy: (chunks) => (
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-teal underline underline-offset-2"
              >
                {chunks}
              </a>
            ),
          })}
          {errors.consent ? (
            <span className="block text-xs text-red-600">
              {errors.consent.message}
            </span>
          ) : null}
        </span>
      </label>

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
        className={cn('w-full', buttonClass('primary', 'lg'))}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
