'use client';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { lookupPostalCode } from '@/utils/address';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FocusEvent, useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type CompanyAddressFormData = {
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

const defaultValues: CompanyAddressFormData = {
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
};

type Props = { onSaved: () => void };

export default function AddressForm({ onSaved }: Props) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompanyAddressFormData>({ defaultValues });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset(defaultValues);
    },
    [reset]
  );

  // Mesmo comportamento da morada pessoal: o código postal preenche o resto,
  // incluindo as coordenadas. Sem elas a API geocodifica pelo endereço, o que é
  // mais lento e menos exato do que o ponto que a TomTom já deu aqui.
  const handleBlurPostalCode = useCallback(
    async (e: FocusEvent<HTMLInputElement>) => {
      const postalCode = e.target.value.trim();
      if (!postalCode) return;

      try {
        const found = await lookupPostalCode(postalCode);
        if (!found) {
          toast.error(tCommon('zipNotFound'));
          return;
        }

        const set = (field: keyof CompanyAddressFormData, val: string) =>
          setValue(field, val, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });

        set('street', found.street);
        set('city', found.city);
        set('cityDivision', found.cityDivision);
        set('country', found.country);
        set('countryDivision', found.countryDivision);
        setValue('lat', found.lat);
        setValue('long', found.long);
      } catch {
        toast.error(tCommon('zipLookupError'));
      }
    },
    [setValue, tCommon]
  );

  const onSubmit = useCallback(
    async (data: CompanyAddressFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.post('/company/me/addresses', data);
            if (!isSuccessStatus(res.status)) throw new Error();
            onSaved();
            reset(defaultValues);
          })(),
          {
            loading: tCommon('saving'),
            success: t('addressCreateSuccess'),
            error: (err) => {
              const response = (
                err as { response?: { status?: number; data?: { message?: string } } }
              )?.response;
              // 409 = já existe a mesma rua/número/código postal nesta empresa.
              if (response?.status === 409) {
                return response.data?.message || t('addressDuplicate');
              }
              return t('addressCreateError');
            },
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSaved, reset, t, tCommon]
  );

  return (
    <DialogForm<CompanyAddressFormData>
      title={t('addAddress')}
      confirmText={tCommon('save')}
      loading={isSubmitting}
      errors={errors}
      onConfirm={handleSubmit(onSubmit)}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="secondary" className="flex items-center gap-2">
          <PlusIcon className="size-4" /> {t('addAddress')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 mt-2">
        <Controller
          name="zipCode"
          control={control}
          rules={{ required: tCommon('requiredField') }}
          render={({ field }) => (
            <div>
              <Label htmlFor="zipCode">{t('zipCode')}</Label>
              <input
                {...field}
                id="zipCode"
                type="text"
                placeholder="0000-000"
                onBlur={(e) => {
                  field.onBlur();
                  handleBlurPostalCode(e);
                }}
                className={`mt-1 w-full px-3 py-2 border ${
                  errors.zipCode ? 'border-red-500' : 'border-secondary'
                } rounded-md shadow-sm text-sm`}
              />
              {errors.zipCode && (
                <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
              )}
            </div>
          )}
        />

        <InputForm
          label={tCommon('address')}
          name="street"
          control={control}
          rules={{ required: tCommon('requiredField') }}
          errors={errors}
          placeholder={tCommon('streetPlaceholder')}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputForm
            label={t('number')}
            name="number"
            control={control}
            rules={{ required: tCommon('requiredField') }}
            errors={errors}
            placeholder="12"
          />
          <InputForm
            label={t('complement')}
            name="complement"
            control={control}
            errors={errors}
            placeholder={tCommon('complementPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputForm
            label={tCommon('city')}
            name="city"
            control={control}
            rules={{ required: tCommon('requiredField') }}
            errors={errors}
            placeholder="Lisboa"
          />
          <InputForm
            label={t('cityDivision')}
            name="cityDivision"
            control={control}
            errors={errors}
            placeholder={tCommon('cityDivisionPlaceholder')}
          />
        </div>

        <InputForm
          label={t('countryDivision')}
          name="countryDivision"
          control={control}
          errors={errors}
          placeholder="Lisboa"
        />
      </div>
    </DialogForm>
  );
}
