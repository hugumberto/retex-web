'use client';

import { FaqCategoryDTO, FaqStatus } from '@/app/types/faq';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CategoryFormData {
  title: string;
  description: string;
  status: FaqStatus;
}

interface Props {
  onSave: () => void;
  category?: FaqCategoryDTO;
  trigger?: React.ReactNode;
}

export default function FaqCategoryForm({ onSave, category, trigger }: Props) {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!category;

  const form = useForm<CategoryFormData>({
    defaultValues: {
      title: category?.title ?? '',
      description: category?.description ?? '',
      status: category?.status ?? FaqStatus.ACTIVE,
    },
  });

  const { control, formState: { errors }, reset, register } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset({
          title: category?.title ?? '',
          description: category?.description ?? '',
          status: category?.status ?? FaqStatus.ACTIVE,
        });
      }
    },
    [reset, category]
  );

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = isEdit
              ? await api.patch(`/faq/category/${category.id}`, data)
              : await api.post('/faq/category', data);
            if (!isSuccessStatus(res.status)) throw new Error();
            onSave();
          })(),
          {
            loading: isEdit ? tCommon('saving') : tCommon('creating'),
            success: isEdit ? t('categoryUpdated') : t('categoryCreated'),
            error: isEdit ? t('categoryUpdateError') : t('categoryCreateError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEdit, category, onSave]
  );

  return (
    <DialogForm
      title={isEdit ? t('categoryEditTitle') : t('categoryCreateTitle')}
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      trigger={
        trigger ?? (
          <Button variant="secondary" className="ml-auto block">
            {t('addCategoryButton')}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <InputForm
          label={tCommon('title')}
          name="title"
          control={control}
          rules={{ required: tCommon('requiredField') }}
          errors={errors}
          placeholder={t('categoryTitlePlaceholder')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{tCommon('description')}</label>
          <textarea
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('categoryDescriptionPlaceholder')}
            {...register('description', {
              required: tCommon('requiredField'),
            })}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{tCommon('status')}</label>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('status')}
          >
            <option value={FaqStatus.ACTIVE}>{tCommon('active')}</option>
            <option value={FaqStatus.INACTIVE}>{tCommon('inactive')}</option>
          </select>
        </div>
      </div>
    </DialogForm>
  );
}
