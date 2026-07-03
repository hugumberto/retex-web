'use client';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';

import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import {
  AgeGroup,
  Quality,
  Season,
  Sex,
  Status,
  StorageUnitDTO,
  StorageUnitFormData,
  Type,
} from '../../types/storage-unit';

// Constants
const QUALITY_OPTIONS = [
  { value: Quality.GOOD, label: 'Bom' },
  { value: Quality.MEDIUM, label: 'Regular' },
  { value: Quality.BAD, label: 'Ruim' },
];

const SEX_OPTIONS = [
  { value: Sex.MALE, label: 'Homem' },
  { value: Sex.FEMALE, label: 'Mulher' },
];

const AGE_GROUP_OPTIONS = [
  { value: AgeGroup.ADULT, label: 'Adulto' },
  { value: AgeGroup.CHILD, label: 'Infantil' },
];

const TYPE_OPTIONS = [
  { value: Type.UPPER_PART, label: 'Superior' },
  { value: Type.UNDER_PART, label: 'Inferior' },
];

const SEASON_OPTIONS = [
  { value: Season.SUMMER, label: 'Verão' },
  { value: Season.WINTER, label: 'Inverno' },
];

const STATUS_OPTIONS = [
  { value: Status.ATIVO, label: 'Ativo' },
  { value: Status.INATIVO, label: 'Inativo' },
];

interface StorageUnitFormProps {
  storageUnitId?: string;
  initialData?: StorageUnitDTO;
  onSave: () => void;
}

export default function StorageUnitForm({
  storageUnitId,
  initialData,
  onSave,
}: StorageUnitFormProps) {
  const isEditing = useMemo(() => !!storageUnitId, [storageUnitId]);
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StorageUnitFormData>({
    defaultValues: initialData
      ? {
          quality: initialData.quality,
          sex: initialData.sex,
          ageGroup: initialData.ageGroup,
          type: initialData.type,
          season: initialData.season,
          state: initialData.status,
          weight: initialData.weight,
        }
      : {
          quality: Quality.GOOD,
          sex: Sex.MALE,
          ageGroup: AgeGroup.ADULT,
          type: Type.UPPER_PART,
          season: Season.SUMMER,
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
              quality: data.quality,
              sex: data.sex,
              ageGroup: data.ageGroup,
              type: data.type,
              season: data.season,
              state: data.state,
              weight: Number.parseFloat(data.weight.toString()),
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          } else {
            const res = await api.post('/storage-unit', {
              quality: data.quality,
              sex: data.sex,
              ageGroup: data.ageGroup,
              type: data.type,
              season: data.season,
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
            label="Qualidade"
            name="quality"
            control={control}
            rules={{ required: 'A qualidade é obrigatória' }}
            options={QUALITY_OPTIONS}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Sexo"
            name="sex"
            control={control}
            rules={{ required: 'O sexo é obrigatório' }}
            options={SEX_OPTIONS}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Faixa etária"
            name="ageGroup"
            control={control}
            rules={{ required: 'A faixa etária é obrigatória' }}
            options={AGE_GROUP_OPTIONS}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Parte da peça"
            name="type"
            control={control}
            rules={{ required: 'A parte da peça é obrigatória' }}
            options={TYPE_OPTIONS}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Estação"
            name="season"
            control={control}
            rules={{ required: 'A estação é obrigatória' }}
            options={SEASON_OPTIONS}
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
