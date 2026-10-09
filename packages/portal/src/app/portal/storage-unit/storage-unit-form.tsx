'use client';
import { useTranslations } from 'next-intl';
import { PencilIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';

import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import {
  Season,
  Status,
  StorageGroup,
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
  const tStorageGroup = useTranslations('enums.storageGroup');
  const tItemType = useTranslations('enums.itemType');
  const tSeason = useTranslations('enums.season');
  const tUnitStatus = useTranslations('enums.unitStatus');

  // As opções são construídas dentro do componente para acompanharem o idioma.
  const groupOptions = Object.values(StorageGroup).map((value) => ({ value, label: tStorageGroup(value) }));
  const typeOptions = [Type.UPPER_PART, Type.UNDER_PART].map((value) => ({ value, label: tItemType(value) }));
  const seasonOptions = [Season.SUMMER, Season.WINTER].map((value) => ({ value, label: tSeason(value) }));
  const statusOptions = [Status.ATIVO, Status.INATIVO].map((value) => ({ value, label: tUnitStatus(value) }));
  const isEditing = useMemo(() => !!storageUnitId, [storageUnitId]);
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StorageUnitFormData>({
    defaultValues: initialData
      ? {
          group: initialData.group,
          type: initialData.type ?? '',
          season: initialData.season ?? '',
          location: initialData.location ?? '',
          state: initialData.status,
          weight: initialData.weight,
        }
      : {
          group: StorageGroup.MEN,
          type: Type.UPPER_PART,
          season: Season.SUMMER,
          location: '',
          state: Status.ATIVO,
          weight: 0,
        },
  });

  const {
    control,
    formState: { errors },
  } = form;

  // O lote não reutilizável é único: não tem estação nem parte.
  const group = form.watch('group');
  const isNonReusable = group === StorageGroup.NON_REUSABLE;

  useEffect(() => {
    if (isNonReusable) {
      form.setValue('type', '');
      form.setValue('season', '');
      form.clearErrors(['type', 'season']);
    }
  }, [isNonReusable, form]);

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
          const nonReusable = data.group === StorageGroup.NON_REUSABLE;
          const location = data.location?.trim() ?? '';
          if (isEditing) {
            // Na edição o null limpa explicitamente a parte / estação.
            const res = await api.put(`/storage-unit/${storageUnitId}`, {
              group: data.group,
              type: nonReusable ? null : data.type || null,
              season: nonReusable ? null : data.season || null,
              location: location || null,
              status: data.state,
              weight: Number.parseFloat(data.weight.toString()),
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          } else {
            const res = await api.post('/storage-unit', {
              group: data.group,
              ...(nonReusable
                ? {}
                : { type: data.type, season: data.season }),
              ...(location ? { location } : {}),
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
            label={tCommon('group')}
            name="group"
            control={control}
            rules={{ required: t('groupRequired') }}
            options={groupOptions}
            errors={errors}
          />
        </div>
        {isNonReusable ? (
          <p className="text-sm text-muted-foreground md:col-span-2">
            {t('nonReusableHint')}
          </p>
        ) : (
          <>
            <div>
              <SelectForm
                label={tCommon('part')}
                name="type"
                control={control}
                rules={{
                  validate: (value, values) =>
                    values.group === StorageGroup.NON_REUSABLE ||
                    !!value ||
                    t('typeRequired'),
                }}
                options={typeOptions}
                errors={errors}
              />
            </div>
            <div>
              <SelectForm
                label={tCommon('season')}
                name="season"
                control={control}
                rules={{
                  validate: (value, values) =>
                    values.group === StorageGroup.NON_REUSABLE ||
                    !!value ||
                    t('seasonRequired'),
                }}
                options={seasonOptions}
                errors={errors}
              />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <InputForm
            label={tCommon('location')}
            name="location"
            placeholder={t('locationPlaceholder')}
            control={control}
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
