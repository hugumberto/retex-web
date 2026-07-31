'use client';

import { FaqItemDTO } from '@/app/types/faq';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ItemFormData {
  title: string;
  description: string;
}

interface Props {
  categoryId: string;
  onSave: () => void;
  item?: FaqItemDTO;
  trigger?: React.ReactNode;
}

export default function FaqItemForm({ categoryId, onSave, item, trigger }: Props) {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!item;

  const form = useForm<ItemFormData>({
    defaultValues: {
      title: item?.title ?? '',
      description: item?.description ?? '',
    },
  });

  const { control, formState: { errors }, reset, register } = form;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset({ title: item?.title ?? '', description: item?.description ?? '' });
    },
    [reset, item]
  );

  const handleSubmit = useCallback(
    async (data: ItemFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = isEdit
              ? await api.patch(`/faq/item/${item.id}`, data)
              : await api.post(`/faq/category/${categoryId}/item`, data);
            if (!isSuccessStatus(res.status)) throw new Error();
            onSave();
          })(),
          {
            loading: isEdit ? tCommon('saving') : tCommon('adding'),
            success: isEdit ? t('itemUpdated') : t('itemCreated'),
            error: isEdit ? t('itemUpdateError') : t('itemCreateError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEdit, item, categoryId, onSave]
  );

  return (
    <DialogForm
      title={isEdit ? t('itemEditTitle') : t('itemCreateTitle')}
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      trigger={
        trigger ?? (
          <Button variant="outline" size="sm">
            {t('addItemButton')}
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
          placeholder={t('itemTitlePlaceholder')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('answer')}</label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('answerPlaceholder')}
            {...register('description', {
              required: tCommon('requiredField'),
            })}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>
    </DialogForm>
  );
}
