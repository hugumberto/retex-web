'use client';

import { useTranslations } from 'next-intl';
import {
  DEFAULT_LABEL_SIZE,
  LABEL_ROTATIONS,
  SystemParameterDTO,
} from '@/app/types/system-parameter';
import { InputForm } from '@/components/form/input-form';
import { SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import ttServices from '@tomtom-international/web-sdk-services';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ParametrosFormData {
  collectionConfirmationDeadlineDays: number;
  qrCodeThresholdPercentage: number;
  labelWidthMm: number;
  labelHeightMm: number;
  labelQrSizeMm: number;
  labelRotationDeg: number;
  warehouseAddress: string;
  warehouseLat: string;
  warehouseLong: string;
  stopBaseMinutes: number;
  stopMinutesPerBag: number;
}

export default function Parametros() {
  const t = useTranslations('parameters');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLocating, setIsLocating] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParametrosFormData>({
    defaultValues: {
      collectionConfirmationDeadlineDays: 2,
      qrCodeThresholdPercentage: 10,
      ...DEFAULT_LABEL_SIZE,
      warehouseAddress: '',
      warehouseLat: '',
      warehouseLong: '',
      stopBaseMinutes: 5,
      stopMinutesPerBag: 1,
    },
  });
  const warehouseLat = watch('warehouseLat');
  const warehouseLong = watch('warehouseLong');

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
        labelRotationDeg: data.labelRotationDeg,
        warehouseAddress: data.warehouseAddress ?? '',
        warehouseLat: data.warehouseLat != null ? String(data.warehouseLat) : '',
        warehouseLong: data.warehouseLong != null ? String(data.warehouseLong) : '',
        stopBaseMinutes: data.stopBaseMinutes ?? 5,
        stopMinutesPerBag: data.stopMinutesPerBag ?? 1,
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
        labelRotationDeg: Number(data.labelRotationDeg),
        warehouseAddress: data.warehouseAddress.trim() || null,
        warehouseLat: data.warehouseLat === '' ? null : Number(data.warehouseLat),
        warehouseLong: data.warehouseLong === '' ? null : Number(data.warehouseLong),
        stopBaseMinutes: Number(data.stopBaseMinutes),
        stopMinutesPerBag: Number(data.stopMinutesPerBag),
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

  // Coordenadas do armazém a partir da morada (TomTom, a mesma chave do mapa).
  const locateWarehouse = async () => {
    const query = getValues('warehouseAddress').trim();
    const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!query || !key) return;
    setIsLocating(true);
    try {
      const response = (await ttServices.services.geocode({
        key,
        query,
        countrySet: 'PT',
        limit: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)) as { results?: { position?: { lat: number; lng: number } }[] };
      const position = response.results?.[0]?.position;
      if (!position) {
        toast.error(t('warehouseNotFound'));
        return;
      }
      setValue('warehouseLat', position.lat.toFixed(7), { shouldDirty: true });
      setValue('warehouseLong', position.lng.toFixed(7), { shouldDirty: true });
      toast.success(t('warehouseLocated'));
    } catch {
      toast.error(t('warehouseNotFound'));
    } finally {
      setIsLocating(false);
    }
  };

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

          <div className="sm:max-w-xs">
            <SelectForm
              label={t('labelRotationLabel')}
              name="labelRotationDeg"
              control={control}
              options={LABEL_ROTATIONS.map((deg) => ({
                label: `${deg}°`,
                value: deg,
              }))}
              rules={{ required: t('measureRequired') }}
              errors={errors}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('labelRotationHelp')}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-secondary/20 pt-6">
          <div>
            <h2 className="text-sm font-semibold text-secondary">
              {t('routesSectionTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('routesSectionHelp')}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <InputForm
                label={t('warehouseAddressLabel')}
                name="warehouseAddress"
                control={control}
                errors={errors}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={locateWarehouse}
              disabled={isLocating}
            >
              {isLocating ? t('locating') : t('locate')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {warehouseLat && warehouseLong
              ? t('warehouseCoords', { lat: warehouseLat, long: warehouseLong })
              : t('warehouseNoCoords')}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputForm
              label={t('stopBaseMinutesLabel')}
              name="stopBaseMinutes"
              type="number"
              control={control}
              rules={{
                required: t('measureRequired'),
                min: { value: 0, message: t('minZero') },
                max: { value: 120, message: t('maxStopBase') },
              }}
              errors={errors}
            />
            <InputForm
              label={t('stopMinutesPerBagLabel')}
              name="stopMinutesPerBag"
              type="number"
              control={control}
              rules={{
                required: t('measureRequired'),
                min: { value: 0, message: t('minZero') },
                max: { value: 30, message: t('maxPerBag') },
              }}
              errors={errors}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('stopTimeHelp')}</p>
        </div>

        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? tCommon('saving') : tCommon('save')}
        </Button>
      </form>
    </section>
  );
}
