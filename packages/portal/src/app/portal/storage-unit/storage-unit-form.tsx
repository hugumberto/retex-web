'use client';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('storageUnit');
  const tCommon = useTranslations('common');
  const tQuality = useTranslations('enums.quality');
  const tSex = useTranslations('enums.sex');
  const tAgeGroup = useTranslations('enums.ageGroup');
  const tItemType = useTranslations('enums.itemType');
  const tSeason = useTranslations('enums.season');
  const tUnitStatus = useTranslations('enums.unitStatus');

  // As opções são construídas dentro do componente para acompanharem o idioma.
  const qualityOptions = [Quality.GOOD, Quality.MEDIUM, Quality.BAD].map((value) => ({ value, label: tQuality(value) }));
  const sexOptions = [Sex.MALE, Sex.FEMALE].map((value) => ({ value, label: tSex(value) }));
  const ageGroupOptions = [AgeGroup.ADULT, AgeGroup.CHILD].map((value) => ({ value, label: tAgeGroup(value) }));
  const typeOptions = [Type.UPPER_PART, Type.UNDER_PART].map((value) => ({ value, label: tItemType(value) }));
  const seasonOptions = [Season.SUMMER, Season.WINTER].map((value) => ({ value, label: tSeason(value) }));
  const statusOptions = [Status.ATIVO, Status.INATIVO].map((value) => ({ value, label: tUnitStatus(value) }));
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
              status: data.state,
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
          ? t('formEditTitle')
          : t('formCreateTitle')
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
            label={tCommon('quality')}
            name="quality"
            control={control}
            rules={{ required: t('qualityRequired') }}
            options={qualityOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label={tCommon('sex')}
            name="sex"
            control={control}
            rules={{ required: t('sexRequired') }}
            options={sexOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label={tCommon('ageGroup')}
            name="ageGroup"
            control={control}
            rules={{ required: t('ageGroupRequired') }}
            options={ageGroupOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label={tCommon('itemType')}
            name="type"
            control={control}
            rules={{ required: t('typeRequired') }}
            options={typeOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label={tCommon('season')}
            name="season"
            control={control}
            rules={{ required: t('seasonRequired') }}
            options={seasonOptions}
            errors={errors}
          />
        </div>
        {isEditing && (
          <>
            <div>
              <SelectForm
                label={tCommon('status')}
                name="state"
                control={control}
                options={statusOptions}
                errors={errors}
              />
            </div>
            <div>
              <InputForm
                label={tCommon('weight')}
                name="weight"
                type="number"
                control={control}
                rules={{
                  required: t('weightRequired'),
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
