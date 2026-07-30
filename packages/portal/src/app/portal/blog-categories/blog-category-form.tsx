'use client';

import { BlogCategory, BlogCategoryStatus } from '@/app/types/blog';
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
  status: BlogCategoryStatus;
}

interface Props {
  onSave: () => void;
  category?: BlogCategory;
  trigger?: React.ReactNode;
}

export default function BlogCategoryForm({ onSave, category, trigger }: Props) {
  const t = useTranslations('blogCategories');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!category;

  const form = useForm<CategoryFormData>({
    defaultValues: {
      title: category?.title ?? '',
      status: category?.status ?? BlogCategoryStatus.ACTIVE,
    },
  });

  const {
    control,
    formState: { errors },
    reset,
    register,
  } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset({
          title: category?.title ?? '',
          status: category?.status ?? BlogCategoryStatus.ACTIVE,
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
              ? await api.patch(`/blog-category/${category.id}`, data)
              : await api.post('/blog-category', data);
            if (!isSuccessStatus(res.status)) throw new Error();
            onSave();
          })(),
          {
            loading: isEdit ? tCommon('saving') : tCommon('creating'),
            success: isEdit ? t('updateSuccess') : t('createSuccess'),
            error: isEdit ? t('updateError') : t('createError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEdit, category, onSave, t, tCommon]
  );

  return (
    <DialogForm
      title={isEdit ? t('formEditTitle') : t('formCreateTitle')}
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      trigger={
        trigger ?? (
          <Button variant="secondary" className="ml-auto block">
            {t('addButton')}
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
          placeholder={t('titlePlaceholder')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{tCommon('status')}</label>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('status')}
          >
            <option value={BlogCategoryStatus.ACTIVE}>{tCommon('active')}</option>
            <option value={BlogCategoryStatus.INACTIVE}>{tCommon('inactive')}</option>
          </select>
        </div>
      </div>
    </DialogForm>
  );
}
