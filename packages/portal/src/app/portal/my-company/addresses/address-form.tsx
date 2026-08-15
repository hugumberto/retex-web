'use client';

import { CompanyAddressFormData } from '@/app/types/company';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type AddressFormProps = {
  onSaved: () => void;
};

export default function AddressForm({ onSaved }: AddressFormProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyAddressFormData>({
    defaultValues: {
      street: '',
      number: '',
      complement: '',
      city: '',
      zipCode: '',
      countryDivision: '',
      country: '',
    },
  });

  const {
    control,
    formState: { errors },
    reset,
  } = form;

  const handleSubmit = useCallback(
    async (data: CompanyAddressFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.post('/company/me/addresses', {
              street: data.street,
              number: data.number,
              complement: data.complement || undefined,
              city: data.city,
              zipCode: data.zipCode,
              countryDivision: data.countryDivision || undefined,
              country: data.country || undefined,
            });
            if (!isSuccessStatus(res.status)) {
              throw new Error('Erro na requisição');
            }
          })(),
          {
            loading: tCommon('loading'),
            success: () => {
              onSaved();
              reset();
              return t('addressCreateSuccess');
            },
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
    <DialogForm
      title={t('addAddress')}
      onConfirm={form.handleSubmit(handleSubmit)}
      loading={isSubmitting}
      errors={errors}
      trigger={<Button variant="secondary">{t('addAddress')}</Button>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputForm
          label={t('street')}
          name="street"
          control={control}
          rules={{ required: true }}
          errors={errors}
        />
        <InputForm
          label={t('number')}
          name="number"
          control={control}
          rules={{ required: true }}
          errors={errors}
        />
        <InputForm
          label={t('complement')}
          name="complement"
          control={control}
          errors={errors}
        />
        <InputForm
          label={tCommon('city')}
          name="city"
          control={control}
          rules={{ required: true }}
          errors={errors}
        />
        <InputForm
          label={t('zipCode')}
          name="zipCode"
          control={control}
          rules={{ required: true }}
          errors={errors}
        />
        <InputForm
          label={t('countryDivision')}
          name="countryDivision"
          control={control}
          errors={errors}
        />
        <InputForm
          label={t('country')}
          name="country"
          control={control}
          errors={errors}
        />
      </div>
    </DialogForm>
  );
}
