'use client';

import { useTranslations } from 'next-intl';
import {
  DEFAULT_LABEL_SIZE,
  SystemParameterDTO,
} from '@/app/types/system-parameter';
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
  labelWidthMm: number;
  labelHeightMm: number;
  labelQrSizeMm: number;
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
      ...DEFAULT_LABEL_SIZE,
    },
  });

  const fetchParameters = useCallback(async () => {
    try {
      const { data } = await api.get<SystemParameterDTO>('/system-parameter');
      reset({
        collectionConfirmationDeadlineDays:
          data.collectionConfirmationDeadlineDays,
        qrCodeThresholdPercentage: data.qrCodeThresholdPercentage,
        labelWidthMm: data.labelWidthMm,
        labelHeightMm: data.labelHeightMm,
        labelQrSizeMm: data.labelQrSizeMm,
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
        labelWidthMm: Number(data.labelWidthMm),
        labelHeightMm: Number(data.labelHeightMm),
        labelQrSizeMm: Number(data.labelQrSizeMm),
      });
      if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      // A API recusa um QR que não caiba na etiqueta; mostrar a mensagem dela
      // diz ao utilizador o que corrigir, em vez de um erro genérico.
      const message = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(typeof message === 'string' ? message : t('saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [t]);

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
        <div className="space-y-4 border-t border-secondary/20 pt-6">
          <div>
            <h2 className="text-sm font-semibold text-secondary">
              {t('labelSectionTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('labelSectionHelp')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputForm
              label={t('labelWidthLabel')}
              name="labelWidthMm"
              type="number"
              control={control}
              rules={{
                required: t('measureRequired'),
                min: { value: 20, message: t('minTwenty') },
                max: { value: 210, message: t('maxWidth') },
              }}
              errors={errors}
            />
            <InputForm
              label={t('labelHeightLabel')}
              name="labelHeightMm"
              type="number"
              control={control}
              rules={{
                required: t('measureRequired'),
                min: { value: 20, message: t('minTwenty') },
                max: { value: 297, message: t('maxHeight') },
              }}
              errors={errors}
            />
            <InputForm
              label={t('labelQrSizeLabel')}
              name="labelQrSizeMm"
              type="number"
              control={control}
              rules={{
                required: t('measureRequired'),
                min: { value: 10, message: t('minTen') },
                max: { value: 200, message: t('maxQrSize') },
              }}
              errors={errors}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t('labelQrSizeHelp')}
          </p>
        </div>

        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? tCommon('saving') : tCommon('save')}
        </Button>
      </form>
    </section>
  );
}
