'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { firstAddressPart } from '../../utils/address';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  gender: string;
  dateOfBirth: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  cityDivision: string;
  country: string;
  countryDivision: string;
  lat: string;
  long: string;
};

const portalLoginHref = (() => {
  const base = process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ?? '';
  return base ? `${base.replace(/\/$/, '')}/auth/login` : '#';
})();

export default function RegistrationForm() {
  const t = useTranslations('register');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactPhone: '',
      gender: '',
      dateOfBirth: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      city: '',
      cityDivision: '',
      country: '',
      countryDivision: '',
      lat: '',
      long: '',
    },
  });

  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>(
    'success'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setValue('street', addr?.streetName ?? '', { shouldValidate: true });
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
      // silent — user can fill manually
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setMessage('');
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
            gender: data.gender || undefined,
            dateOfBirth: data.dateOfBirth || undefined,
            address: {
              zipCode: data.zipCode,
              street: data.street,
              number: data.number || undefined,
              complement: data.complement || undefined,
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
        setMessageTone('error');
        setMessage(t('feedback.duplicateEmail'));
        return;
      }
      if (!res.ok) throw new Error();
      const body = await res.json().catch(() => null);
      setMessageTone('success');
      setMessage(
        body?.inServiceZone
          ? t('feedback.successInZone')
          : t('feedback.successOutOfZone')
      );
      reset();
    } catch {
      setMessageTone('error');
      setMessage(t('feedback.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const req = { required: tValidation('required') };

  return (
    <form
      className="register-card"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h2 className="register-card-title">{t('title')}</h2>

      {message ? (
        <p
          className={
            messageTone === 'error'
              ? 'landing-form-feedback landing-form-feedback--error'
              : 'landing-form-feedback'
          }
        >
          {message}
        </p>
      ) : null}

      <div className="form-row">
        <label>
          <span className="form-label">
            {t('fields.firstName')}
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="given-name"
            className={errors.firstName ? 'field-error' : undefined}
            {...register('firstName', req)}
          />
          {errors.firstName ? (
            <span className="form-field-error">{errors.firstName.message}</span>
          ) : null}
        </label>
        <label>
          <span className="form-label">
            {t('fields.lastName')}
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="family-name"
            className={errors.lastName ? 'field-error' : undefined}
            {...register('lastName', req)}
          />
          {errors.lastName ? (
            <span className="form-field-error">{errors.lastName.message}</span>
          ) : null}
        </label>
      </div>

      <label>
        <span className="form-label">
          {t('fields.email')}
          <span className="form-req">*</span>
        </span>
        <input
          type="email"
          autoComplete="email"
          className={errors.email ? 'field-error' : undefined}
          {...register('email', {
            ...req,
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: tValidation('invalidEmail'),
            },
          })}
        />
        {errors.email ? (
          <span className="form-field-error">{errors.email.message}</span>
        ) : null}
      </label>

      <div className="form-row">
        <label>
          <span className="form-label">
            {t('fields.phone')}
            <span className="form-req">*</span>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            className={errors.contactPhone ? 'field-error' : undefined}
            {...register('contactPhone', req)}
          />
          {errors.contactPhone ? (
            <span className="form-field-error">
              {errors.contactPhone.message}
            </span>
          ) : null}
        </label>
        <label>
          <span className="form-label">
            {t('fields.zipCode')}
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            placeholder={t('fields.zipCodePlaceholder')}
            autoComplete="postal-code"
            className={errors.zipCode ? 'field-error' : undefined}
            {...register('zipCode', req)}
            onBlur={handleBlurZipCode}
          />
          {errors.zipCode ? (
            <span className="form-field-error">{errors.zipCode.message}</span>
          ) : null}
        </label>
      </div>

      <label>
        <span className="form-label">
          {t('fields.street')}
          <span className="form-req">*</span>
        </span>
        <input
          type="text"
          autoComplete="street-address"
          className={errors.street ? 'field-error' : undefined}
          {...register('street', req)}
        />
        {errors.street ? (
          <span className="form-field-error">{errors.street.message}</span>
        ) : null}
      </label>

      <div className="form-row">
        <label>
          <span className="form-label">
            {t('fields.number')}
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="address-line2"
            className={errors.number ? 'field-error' : undefined}
            {...register('number', req)}
          />
          {errors.number ? (
            <span className="form-field-error">{errors.number.message}</span>
          ) : null}
        </label>
        <label>
          <span className="form-label">{t('fields.complement')}</span>
          <input type="text" {...register('complement')} />
        </label>
      </div>
      <div className="form-row">
        <label>
          <span className="form-label">
            {t('fields.city')}
            <span className="form-req">*</span>
          </span>
          <input
            type="text"
            autoComplete="address-level2"
            {...register('city')}
          />
        </label>
        <label>
          <span className="form-label">
            {t('fields.cityDivision')}
            <span className="form-req">*</span>
          </span>
          <input type="text" {...register('cityDivision')} />
        </label>
      </div>
      <div>
        <span className="form-label">
          {t('fields.gender')}
          <span className="form-req">*</span>
        </span>
        <div
          className="radio-group"
          role="radiogroup"
          aria-label={t('fields.gender')}
        >
          {(
            [
              { value: 'MALE', label: t('gender.male') },
              { value: 'FEMALE', label: t('gender.female') },
              { value: 'PREFER_NOT_TO_SAY', label: t('gender.preferNotToSay') },
            ] as const
          ).map(({ value, label }) => (
            <label key={value} className="radio-option">
              <input type="radio" value={value} {...register('gender', req)} />
              {label}
            </label>
          ))}
        </div>
        {errors.gender ? (
          <span className="form-field-error">{errors.gender.message}</span>
        ) : null}
      </div>

      <label>
        <span className="form-label">
          {t('fields.dateOfBirth')}
          <span className="form-req">*</span>
        </span>
        <input
          type="date"
          className={errors.dateOfBirth ? 'field-error' : undefined}
          {...register('dateOfBirth', req)}
        />
        {errors.dateOfBirth ? (
          <span className="form-field-error">{errors.dateOfBirth.message}</span>
        ) : null}
      </label>

      <input type="hidden" {...register('country')} />
      <input type="hidden" {...register('countryDivision')} />
      <input type="hidden" {...register('lat')} />
      <input type="hidden" {...register('long')} />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </button>

      <p className="register-login-link">
        {t('alreadyHaveAccount')}{' '}
        <a href={portalLoginHref} target="_blank" rel="noopener noreferrer">
          {t('login')}
        </a>
      </p>

      <div className="register-social-row" aria-label={t('socialAria')}>
        <span
          className="register-social-icon"
          aria-label="Facebook"
          role="button"
          tabIndex={0}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
        </span>
        <span
          className="register-social-icon"
          aria-label="Google"
          role="button"
          tabIndex={0}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        </span>
        <span
          className="register-social-icon"
          aria-label="LinkedIn"
          role="button"
          tabIndex={0}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </span>
      </div>
    </form>
  );
}
