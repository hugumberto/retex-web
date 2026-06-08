'use client';

import { Brand, BrandFormData } from '@/app/types/brand';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type BrandFormProps = {
  brandId?: string;
  initialData?: Brand;
  onSave: () => void;
};

export default function BrandForm({
  brandId,
  initialData,
  onSave,
}: BrandFormProps) {
  const isEditing = useMemo(() => !!brandId, [brandId]);
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BrandFormData>({
    defaultValues: {
      name: initialData?.name ?? '',
    },
  });

  const {
    control,
    formState: { errors },
    reset,
  } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        reset({
          name: initialData?.name ?? '',
          manual: initialData?.manual ?? false,
        });
      }
    },
    [initialData?.manual, initialData?.name, reset]
  );

  const handleSubmit = useCallback(
    async (data: BrandFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            if (isEditing) {
              const res = await api.put(`/brand/${brandId}`, {
                name: data.name,
                manual: data.manual,
              });
              if (!isSuccessStatus(res.status)) {
                throw new Error('Erro na requisição');
              }
            } else {
              const res = await api.post('/brand', {
                name: data.name,
                manual: data.manual,
              });
              if (!isSuccessStatus(res.status)) {
                throw new Error('Erro na requisição');
              }
            }
          })(),
          {
            loading: 'Carregando...',
            success: () => {
              onSave();
              setIsOpen(false);
              reset({ name: '', manual: false });
              return `Marca ${
                isEditing ? 'atualizada' : 'criada'
              } com sucesso!`;
            },
            error: () =>
              `Erro ao ${isEditing ? 'atualizar' : 'criar'} a marca.`,
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [brandId, isEditing, onSave, reset]
  );

  return (
    <DialogForm
      title={isEditing ? 'Atualizar Marca' : 'Cadastro de Marca'}
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      trigger={
        isEditing ? (
          <Button variant="ghost" size="icon" className="size-8">
            <PencilIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary" className="ml-auto block">
            Criar
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <InputForm
          label="Nome"
          name="name"
          control={control}
          rules={{ required: 'O nome é obrigatório' }}
          errors={errors}
          placeholder="Nome da marca"
        />
      </div>
    </DialogForm>
  );
}
