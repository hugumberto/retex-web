'use client';

import { useTranslations } from 'next-intl';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { lookupPostalCode } from '@/utils/address';
import { PlusIcon } from 'lucide-react';
import { FocusEvent, useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type AddressFormData = {
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
  isDefault: boolean;
};

const defaultValues: AddressFormData = {
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
  isDefault: false,
};

type Props = { onSave: () => void };

export default function AddressForm({ onSave }: Props) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<AddressFormData>({ defaultValues });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset(defaultValues);
    },
    [reset]
  );

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

        const set = (field: keyof AddressFormData, val: string) =>
          setValue(field, val, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

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
    async (data: AddressFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.post('/me/address', data);
            if (!isSuccessStatus(res.status)) throw new Error();
            onSave();
            reset(defaultValues);
          })(),
          {
            loading: tCommon('saving'),
            success: t('addressAdded'),
            error: t('addressAddError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSave, reset]
  );

  return (
    <DialogForm<AddressFormData>
      title={t('newAddressTitle')}
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
                onBlur={(e) => { field.onBlur(); handleBlurPostalCode(e); }}
                className={`mt-1 w-full px-3 py-2 border ${errors.zipCode ? 'border-red-500' : 'border-secondary'} rounded-md shadow-sm text-sm`}
              />
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>}
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

        <Controller
          name="isDefault"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                {t('setAsDefault')}
              </Label>
            </div>
          )}
        />
      </div>
    </DialogForm>
  );
}
