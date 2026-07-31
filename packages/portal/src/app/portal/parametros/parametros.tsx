'use client';

import { useTranslations } from 'next-intl';
import { SystemParameterDTO } from '@/app/types/system-parameter';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ParametrosFormData {
  collectionConfirmationDeadlineDays: number;
  qrCodeThresholdPercentage: number;
}

export default function Parametros() {
  const t = useTranslations('parameters');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParametrosFormData>({
    defaultValues: {
      collectionConfirmationDeadlineDays: 2,
      qrCodeThresholdPercentage: 10,
    },
  });

  const fetchParameters = useCallback(async () => {
    try {
      const { data } = await api.get<SystemParameterDTO>('/system-parameter');
      reset({
        collectionConfirmationDeadlineDays:
          data.collectionConfirmationDeadlineDays,
        qrCodeThresholdPercentage: data.qrCodeThresholdPercentage,
      });
    } catch (error) {
      console.error('Erro ao buscar parâmetros:', error);
    }
  }, [reset]);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/parametros' }]);
    fetchParameters();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, fetchParameters, t]);

  const handleSave = useCallback(async (data: ParametrosFormData) => {
    setIsSubmitting(true);
    try {
      const res = await api.put('/system-parameter', {
        collectionConfirmationDeadlineDays: Number(
          data.collectionConfirmationDeadlineDays
        ),
        qrCodeThresholdPercentage: Number(data.qrCodeThresholdPercentage),
      });
      if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <section id="parametros-page" className="max-w-lg">
      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <div>
          <InputForm
            label={t('confirmationDeadlineLabel')}
            name="collectionConfirmationDeadlineDays"
            type="number"
            control={control}
            rules={{
              required: t('daysRequired'),
              min: { value: 0, message: t('minZero') },
              max: { value: 30, message: t('maxThirty') },
            }}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('confirmationDeadlineHelp')}
          </p>
        </div>
        <div>
          <InputForm
            label={t('qrThresholdLabel')}
            name="qrCodeThresholdPercentage"
            type="number"
            control={control}
            rules={{
              required: t('percentageRequired'),
              min: { value: 0, message: t('minZero') },
              max: { value: 100, message: t('maxHundred') },
            }}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('qrThresholdHelp')}
          </p>
        </div>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? tCommon('saving') : tCommon('save')}
        </Button>
      </form>
    </section>
  );
}
