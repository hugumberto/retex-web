'use client';

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
    setPageTitle('Parâmetros Gerais');
    setBreadcrumbs([{ label: 'Parâmetros Gerais', href: '/portal/parametros' }]);
    fetchParameters();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, fetchParameters]);

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
      toast.success('Parâmetros atualizados');
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      toast.error('Não foi possível salvar os parâmetros');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <section id="parametros-page" className="max-w-lg">
      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <div>
          <InputForm
            label="Prazo de confirmação da recolha (dias antes)"
            name="collectionConfirmationDeadlineDays"
            type="number"
            control={control}
            rules={{
              required: 'Informe o número de dias',
              min: { value: 0, message: 'Mínimo de 0' },
              max: { value: 30, message: 'Máximo de 30' },
            }}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Até quantos dias antes da recolha o cliente pode confirmar. Sem
            confirmação até o prazo, a solicitação sai da rota.
          </p>
        </div>
        <div>
          <InputForm
            label="Threshold de QR codes (%)"
            name="qrCodeThresholdPercentage"
            type="number"
            control={control}
            rules={{
              required: 'Informe o percentual',
              min: { value: 0, message: 'Mínimo de 0' },
              max: { value: 100, message: 'Máximo de 100' },
            }}
            errors={errors}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Percentual extra de QR codes gerados sobre os volumes informados ao
            iniciar a rota (ex.: 10% → 3 volumes geram 4 códigos).
          </p>
        </div>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? 'A guardar...' : 'Guardar'}
        </Button>
      </form>
    </section>
  );
}
