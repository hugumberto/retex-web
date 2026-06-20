'use client';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${postalCode}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
        );
        if (!res.ok) throw new Error();

        const { results } = await res.json();
        if (!Array.isArray(results) || results.length === 0) {
          toast.error('Código postal não encontrado');
          return;
        }

        const { address, position } = results[0];
        const set = (field: keyof AddressFormData, val: string) =>
          setValue(field, val, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

        set('street', address.streetName ?? '');
        set('city', address.municipality ?? '');
        set('cityDivision', address.municipalitySubdivision ?? '');
        set('country', address.country ?? '');
        set('countryDivision', address.countrySecondarySubdivision ?? address.countrySubdivision ?? '');
        setValue('lat', position?.lat ? String(position.lat) : '');
        setValue('long', position?.lon ? String(position.lon) : '');
      } catch {
        toast.error('Não foi possível buscar o endereço pelo código postal');
      }
    },
    [setValue]
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
            loading: 'A guardar...',
            success: 'Endereço adicionado com sucesso',
            error: 'Erro ao adicionar endereço',
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
      title="Novo Endereço"
      confirmText="Guardar"
      loading={isSubmitting}
      errors={errors}
      onConfirm={handleSubmit(onSubmit)}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="secondary" className="flex items-center gap-2">
          <PlusIcon className="size-4" /> Adicionar endereço
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 mt-2">
        <Controller
          name="zipCode"
          control={control}
          rules={{ required: 'Código postal obrigatório' }}
          render={({ field }) => (
            <div>
              <Label htmlFor="zipCode">Código Postal</Label>
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
          label="Morada"
          name="street"
          control={control}
          rules={{ required: 'Morada obrigatória' }}
          errors={errors}
          placeholder="Rua / Avenida"
        />

        <div className="grid grid-cols-2 gap-3">
          <InputForm
            label="Nº de Porta"
            name="number"
            control={control}
            rules={{ required: 'Número obrigatório' }}
            errors={errors}
            placeholder="12"
          />
          <InputForm
            label="Complemento"
            name="complement"
            control={control}
            errors={errors}
            placeholder="Andar, apartamento..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputForm
            label="Cidade"
            name="city"
            control={control}
            rules={{ required: 'Cidade obrigatória' }}
            errors={errors}
            placeholder="Lisboa"
          />
          <InputForm
            label="Freguesia"
            name="cityDivision"
            control={control}
            errors={errors}
            placeholder="Parque das Nações"
          />
        </div>

        <InputForm
          label="Distrito"
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
                Definir como endereço padrão
              </Label>
            </div>
          )}
        />
      </div>
    </DialogForm>
  );
}
