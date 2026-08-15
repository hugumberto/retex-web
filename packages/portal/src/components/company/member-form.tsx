'use client';

import { CompanyMemberDTO, CompanyProfileDTO } from '@/app/types/company';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { SelectForm } from '@/components/form/select-form';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone?: string;
  profileId: string;
}

type MemberFormProps = {
  /** `/company/me` (gestor) ou `/company/:id` (admin) — os handlers são os mesmos. */
  basePath: string;
  profiles: CompanyProfileDTO[];
  /** Presente => edição. Só o perfil é editável; é o único campo que o PATCH aceita. */
  member?: CompanyMemberDTO;
  onSaved: () => void;
  trigger: React.ReactNode;
};

export default function MemberForm({
  basePath,
  profiles,
  member,
  onSaved,
  trigger,
}: MemberFormProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('enums.companyProfile');
  const memberId = member?.id;
  const isEditing = !!memberId;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MemberFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactPhone: '',
      profileId: member?.profileId ?? '',
    },
  });

  const {
    control,
    formState: { errors },
    reset,
  } = form;

  const profileOptions = useMemo(
    () =>
      profiles.map((profile) => ({
        // Perfis de sistema (companyId null) são MANAGER/COLLABORATOR e têm
        // tradução; perfis próprios de uma empresa só existem na base de dados,
        // por isso usa-se o nome tal como lá está.
        label: profile.companyId ? profile.name : tProfile(profile.key),
        value: profile.id,
      })),
    [profiles, tProfile]
  );

  const handleSubmit = useCallback(
    async (data: MemberFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = memberId
              ? await api.patch(`${basePath}/members/${memberId}`, {
                  profileId: data.profileId,
                })
              : await api.post(`${basePath}/members`, {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  contactPhone: data.contactPhone || undefined,
                  profileId: data.profileId,
                });
            if (!isSuccessStatus(res.status)) {
              throw new Error('Erro na requisição');
            }
          })(),
          {
            loading: tCommon('loading'),
            success: () => {
              onSaved();
              if (!isEditing) reset();
              return isEditing
                ? t('memberUpdateSuccess')
                : t('memberCreateSuccess');
            },
            error: (err) => {
              const response = (
                err as { response?: { status?: number; data?: { message?: string } } }
              )?.response;
              // 409 = email já registado; a mensagem da API é mais útil que a nossa.
              if (response?.status === 409) {
                return response.data?.message || t('memberCreateError');
              }
              return isEditing ? t('memberUpdateError') : t('memberCreateError');
            },
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [basePath, isEditing, memberId, onSaved, reset, t, tCommon]
  );

  return (
    <DialogForm
      title={isEditing ? t('editMember') : t('addMember')}
      description={isEditing ? undefined : t('addMemberHint')}
      onConfirm={form.handleSubmit(handleSubmit)}
      loading={isSubmitting}
      errors={errors}
      trigger={trigger}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!isEditing && (
          <>
            <InputForm
              label={tCommon('name')}
              name="firstName"
              control={control}
              rules={{ required: true }}
              errors={errors}
            />
            <InputForm
              label={tCommon('lastName')}
              name="lastName"
              control={control}
              rules={{ required: true }}
              errors={errors}
            />
            <InputForm
              label={tCommon('email')}
              name="email"
              control={control}
              rules={{ required: true }}
              errors={errors}
            />
            <InputForm
              label={t('phone')}
              name="contactPhone"
              control={control}
              errors={errors}
            />
          </>
        )}
        <SelectForm
          label={t('profile')}
          name="profileId"
          control={control}
          options={profileOptions}
          rules={{ required: true }}
          errors={errors}
        />
      </div>
    </DialogForm>
  );
}
