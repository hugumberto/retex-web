'use client';

import { Brand, BrandFormData } from '@/app/types/brand';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('brand');
  const tCommon = useTranslations('common');
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
            loading: tCommon('loading'),
            success: () => {
              onSave();
              setIsOpen(false);
              reset({ name: '', manual: false });
              return isEditing ? t('updateSuccess') : t('createSuccess');
            },
            error: (err) => {
              const response = (
                err as {
                  response?: { status?: number; data?: { message?: string } };
                }
              )?.response;
              if (response?.status === 409) {
                return (
                  response.data?.message || t('duplicateName')
                );
              }
              return isEditing ? t('updateError') : t('createError');
            },
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [brandId, isEditing, onSave, reset, t, tCommon]
  );

  return (
    <DialogForm
      title={isEditing ? t('formEditTitle') : t('formCreateTitle')}
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
            {tCommon('create')}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <InputForm
          label={tCommon('name')}
          name="name"
          control={control}
          rules={{ required: tCommon('nameRequired') }}
          errors={errors}
          placeholder={t('namePlaceholder')}
        />
      </div>
    </DialogForm>
  );
}
