'use client';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { SelectFieldOption, SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';

import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import {
  Quality,
  Status,
  StorageUnitDTO,
  StorageUnitFormData,
} from '../../types/storage-unit';

// Constants
const QUALITY_OPTIONS = [
  { value: Quality.GOOD, label: 'Bom' },
  { value: Quality.MEDIUM, label: 'Regular' },
  { value: Quality.BAD, label: 'Ruim' },
];

const STATUS_OPTIONS = [
  { value: Status.ATIVO, label: 'Ativo' },
  { value: Status.INATIVO, label: 'Inativo' },
];

interface StorageUnitFormProps {
  storageUnitId?: string;
  initialData?: StorageUnitDTO;
  brandOptions: SelectFieldOption[];
  onSave: () => void;
}

export default function StorageUnitForm({
  storageUnitId,
  initialData,
  brandOptions,
  onSave,
}: StorageUnitFormProps) {
  const isEditing = useMemo(() => !!storageUnitId, [storageUnitId]);
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StorageUnitFormData>({
    defaultValues: initialData
      ? {
          brandId: initialData.brand.id,
          quality: initialData.quality,
          state: initialData.status,
          weight: initialData.weight,
        }
      : {
          brandId: '',
          quality: Quality.GOOD,
          state: Status.ATIVO,
          weight: 0,
        },
  });

  const {
    control,
    formState: { errors },
  } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        form.reset();
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    async (data: StorageUnitFormData) => {
      setIsSubmitting(true);
      toast.promise(
        async () => {
          if (isEditing) {
            const res = await api.put(`/storage-unit/${storageUnitId}`, {
              brandId: data.brandId,
              quality: data.quality,
              state: data.state,
              weight: Number.parseFloat(data.weight.toString()),
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          } else {
            const res = await api.post('/storage-unit', {
              brandId: data.brandId,
              quality: data.quality,
              state: data.state,
              weight: data.weight,
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          }
          form.reset();
        },
        {
          loading: 'Carregando...',
          success: () => {
            onSave();
            setIsOpen(false);
            return `Unidade de Armazenamento ${
              isEditing ? 'atualizada' : 'criada'
            } com sucesso!`;
          },
          error: () => {
            return `Erro ao ${
              isEditing ? 'atualizar' : 'criar'
            } a Unidade de Armazenamento.`;
          },
        }
      );
      setIsSubmitting(false);
    },
    [isEditing, storageUnitId, form, onSave]
  );

  return (
    <DialogForm
      triggerText={isEditing ? 'Editar' : 'Criar'}
      title={
        isEditing
          ? 'Atualizar Unidade de Armazenamento'
          : 'Cadastro de Unidade de Armazenamento'
      }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SelectForm
            label="Marca"
            name="brandId"
            control={control}
            rules={{ required: 'A marca é obrigatória' }}
            options={brandOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Qualidade"
            name="quality"
            control={control}
            rules={{ required: 'A qualidade é obrigatória' }}
            options={QUALITY_OPTIONS}
            errors={errors}
          />
        </div>
        {isEditing && (
          <>
            <div>
              <SelectForm
                label="Estado"
                name="state"
                control={control}
                options={STATUS_OPTIONS}
                errors={errors}
              />
            </div>
            <div>
              <InputForm
                label="Peso"
                name="weight"
                type="number"
                control={control}
                rules={{
                  required: 'O peso é obrigatório',
                }}
                errors={errors}
              />
            </div>
          </>
        )}
      </div>
    </DialogForm>
  );
}
