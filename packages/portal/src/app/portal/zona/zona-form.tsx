'use client';

import { ZoneFormData } from '@/app/types/zone';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ZonaFormProps = {
  onSave: () => void;
};

export default function ZonaForm({ onSave }: ZonaFormProps) {
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ZoneFormData>({
    defaultValues: { city: '' },
  });

  const { control, formState: { errors }, reset } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) reset({ city: '' });
    },
    [reset]
  );

  const handleSubmit = useCallback(
    async (data: ZoneFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.post('/zone', { city: data.city });
            if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
          })(),
          {
            loading: 'A criar zona...',
            success: () => {
              onSave();
              setIsOpen(false);
              reset({ city: '' });
              return 'Zona criada com sucesso!';
            },
            error: () => 'Erro ao criar a zona.',
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSave, reset]
  );

  return (
    <DialogForm
      title="Adicionar Zona de Actuação"
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      trigger={
        <Button variant="secondary" className="ml-auto block">
          Adicionar zona
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <InputForm
          label="Cidade"
          name="city"
          control={control}
          rules={{ required: 'A cidade é obrigatória' }}
          errors={errors}
          placeholder="ex: Lisboa"
        />
      </div>
    </DialogForm>
  );
}
