'use client';

import { CompanyMemberDTO, CompanyProfileDTO } from '@/app/types/company';
import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone?: string;
  profileId: string;
}

export default function CompanyMembersPage() {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('enums.companyProfile');
  const params = useParams<{ id: string }>();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [members, setMembers] = useState<CompanyMemberDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MemberFormData>({
    defaultValues: { firstName: '', lastName: '', email: '', contactPhone: '', profileId: '' },
  });
  const { control, formState: { errors }, reset, setValue } = form;

  const fetchAll = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([
        api.get<CompanyMemberDTO[]>(`/company/${params.id}/members`),
        api.get<CompanyProfileDTO[]>(`/company/${params.id}/profiles`),
      ]);
      if (!isSuccessStatus(m.status) || !isSuccessStatus(p.status)) throw new Error();
      setMembers(m.data ?? []);
      // Só COLLABORATOR é atribuível a novos membros no arranque; a estrutura
      // já suporta mais perfis sem alterações aqui.
      const collaborator = (p.data ?? []).find((x) => x.key === 'COLLABORATOR');
      if (collaborator) setValue('profileId', collaborator.id);
    } catch {
      toast.error(t('loadError'));
    }
  }, [params.id, setValue, t]);

  useEffect(() => {
    setPageTitle(t('members'));
    setBreadcrumbs([
      { label: t('pageTitle'), href: '/portal/company' },
      { label: t('members'), href: `/portal/company/${params.id}/members` },
    ]);
    fetchAll();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll, params.id]);

  const handleCreate = useCallback(
    async (data: MemberFormData) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.post(`/company/${params.id}/members`, data);
            if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
          })(),
          {
            loading: tCommon('loading'),
            success: () => {
              fetchAll();
              reset();
              return t('memberCreateSuccess');
            },
            error: t('memberCreateError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [params.id, fetchAll, reset, t, tCommon]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DialogForm
          title={t('addMember')}
          onConfirm={form.handleSubmit(handleCreate)}
          loading={isSubmitting}
          errors={errors}
          trigger={<Button variant="secondary">{t('addMember')}</Button>}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm label={tCommon('name')} name="firstName" control={control} rules={{ required: true }} errors={errors} />
            <InputForm label={tCommon('lastName')} name="lastName" control={control} rules={{ required: true }} errors={errors} />
            <InputForm label={tCommon('email')} name="email" control={control} rules={{ required: true }} errors={errors} />
            <InputForm label={t('phone')} name="contactPhone" control={control} errors={errors} />
          </div>
        </DialogForm>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon('name')}</TableHead>
            <TableHead>{tCommon('email')}</TableHead>
            <TableHead>{t('profile')}</TableHead>
            <TableHead>{t('status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                {`${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim() || '-'}
              </TableCell>
              <TableCell>{member.user?.email ?? '-'}</TableCell>
              <TableCell>
                {member.profile?.key ? tProfile(member.profile.key) : '-'}
              </TableCell>
              <TableCell>
                {member.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
