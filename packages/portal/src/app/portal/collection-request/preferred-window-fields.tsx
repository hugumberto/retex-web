'use client';

import { CollectionInterval } from '@/app/types/package-collection';
import { format, addDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export type PreferredWindowValues = {
  preferredDate: string;
  preferredInterval: CollectionInterval | '';
};

// O mais cedo que se pede é amanhã: no próprio dia já não há rota a montar.
export const earliestPreferredDate = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');

/**
 * Dia e período em que o cliente prefere a recolha. Indicativo: a janela que
 * conta é a da rota, que a equipa monta a partir destes pedidos.
 */
export default function PreferredWindowFields<T extends FieldValues & PreferredWindowValues>({
  form,
  required,
}: {
  form: UseFormReturn<T>;
  required: boolean;
}) {
  const t = useTranslations('collectionRequest.window');
  const tCommon = useTranslations('common');
  const { register, formState } = form;
  const errors = formState.errors as Partial<Record<keyof PreferredWindowValues, { message?: string }>>;
  const rules = required ? { required: tCommon('requiredField') } : {};
  const field =
    'h-10 w-full rounded-md border bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/30';

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-navy">
        {required ? t('label') : t('labelOptional')}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink">{t('date')}</span>
          <input
            type="date"
            min={earliestPreferredDate()}
            className={`${field} ${errors.preferredDate ? 'border-red-500' : 'border-field'}`}
            {...register('preferredDate' as Path<T>, rules)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink">{t('interval')}</span>
          <select
            className={`${field} ${errors.preferredInterval ? 'border-red-500' : 'border-field'}`}
            {...register('preferredInterval' as Path<T>, rules)}
          >
            <option value="">{t('intervalPlaceholder')}</option>
            {Object.values(CollectionInterval).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      {errors.preferredDate || errors.preferredInterval ? (
        <p className="text-xs text-destructive">
          {errors.preferredDate?.message ?? errors.preferredInterval?.message}
        </p>
      ) : (
        <p className="text-xs text-ink">{t('hint')}</p>
      )}
    </fieldset>
  );
}

/** Para o payload: só envia o que foi preenchido. */
export const preferredWindowPayload = (values: PreferredWindowValues) => ({
  preferredDate: values.preferredDate || undefined,
  preferredInterval: values.preferredInterval || undefined,
});
