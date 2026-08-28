'use client';

import { CompanyDTO, CompanyFormData } from '@/app/types/company';
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

type CompanyFormProps = {
  company?: CompanyDTO;
  onSaved: () => void;
};

export default function CompanyForm({ company, onSaved }: CompanyFormProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const isEditing = useMemo(() => !!company?.id, [company?.id]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormData>({
    defaultValues: {
      name: company?.name ?? '',
      legalName: company?.legalName ?? '',
      taxId: company?.taxId ?? '',
      email: company?.email ?? '',
      phone: company?.phone ?? '',
      manager: { firstName: '', lastName: '', email: '', contactPhone: '' },
    },
  });

  const {
    control,
    formState: { errors },
    reset,
  } = form;

  const handleSubmit = useCallback(
    async (data: CompanyFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            // Na edição não se toca no gestor: os membros gerem-se no ecrã
            // próprio, onde há perfis e desativação.
            const body = {
              name: data.name,
              legalName: data.legalName || undefined,
              taxId: data.taxId,
              email: data.email || undefined,
              phone: data.phone || undefined,
              ...(isEditing ? {} : { manager: data.manager }),
            };
            const res = isEditing
              ? await api.patch(`/company/${company!.id}`, body)
              : await api.post('/company', body);
            if (!isSuccessStatus(res.status)) {
              throw new Error('Erro na requisição');
            }
          })(),
          {
            loading: tCommon('loading'),
            success: () => {
              onSaved();
              if (!isEditing) reset();
              return isEditing ? t('updateSuccess') : t('createSuccess');
            },
            error: (err) => {
              const response = (
                err as { response?: { status?: number; data?: { message?: string } } }
              )?.response;
              if (response?.status === 409) {
                return (
                  response.data?.message ||
                  (isEditing ? t('updateError') : t('createError'))
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
    [company, isEditing, onSaved, reset, t, tCommon]
  );

  return (
    <DialogForm
      title={isEditing ? t('pageTitle') : t('pageTitle')}
      onConfirm={form.handleSubmit(handleSubmit)}
      loading={isSubmitting}
      errors={errors}
      trigger={
        isEditing ? (
          <Button variant="ghost" size="icon" className="size-8">
            <PencilIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary">{tCommon('create')}</Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputForm
          label={t('name')}
          name="name"
          control={control}
          rules={{ required: tCommon('nameRequired') }}
          errors={errors}
        />
        <InputForm
          label={t('legalName')}
          name="legalName"
          control={control}
          errors={errors}
        />
        <InputForm
          label={t('taxId')}
          name="taxId"
          control={control}
          rules={{ required: tCommon('requiredField') }}
          errors={errors}
        />
        <InputForm
          label={tCommon('email')}
          name="email"
          control={control}
          errors={errors}
        />
        <InputForm
          label={t('phone')}
          name="phone"
          control={control}
          errors={errors}
        />
      </div>

      {!isEditing && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-secondary">
            {t('addManager')}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label={tCommon('name')}
              name="manager.firstName"
              control={control}
              rules={{ required: tCommon('requiredField') }}
              errors={errors}
            />
            <InputForm
              label={tCommon('lastName')}
              name="manager.lastName"
              control={control}
              rules={{ required: tCommon('requiredField') }}
              errors={errors}
            />
            <InputForm
              label={tCommon('email')}
              name="manager.email"
              control={control}
              rules={{ required: tCommon('requiredField') }}
              errors={errors}
            />
            <InputForm
              label={t('phone')}
              name="manager.contactPhone"
              control={control}
              errors={errors}
            />
          </div>
        </div>
      )}
    </DialogForm>
  );
}
