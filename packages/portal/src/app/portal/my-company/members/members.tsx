'use client';

import { CompanyMemberDTO, CompanyProfileDTO } from '@/app/types/company';
import MemberForm from '@/components/company/member-form';
import MemberTable from '@/components/company/member-table';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const BASE_PATH = '/company/me';

export default function MyCompanyMembers() {
  const t = useTranslations('company');
  const { user, setPageTitle, setBreadcrumbs } = useAppStore();
  const [members, setMembers] = useState<CompanyMemberDTO[]>([]);
  const [profiles, setProfiles] = useState<CompanyProfileDTO[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([
        api.get<CompanyMemberDTO[]>(`${BASE_PATH}/members`),
        api.get<CompanyProfileDTO[]>(`${BASE_PATH}/profiles`),
      ]);
      if (!isSuccessStatus(m.status) || !isSuccessStatus(p.status)) {
        throw new Error();
      }
      setMembers(m.data ?? []);
      setProfiles(p.data ?? []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('members'));
    setBreadcrumbs([
      { label: t('myCompanyTitle'), href: '/portal/my-company' },
      { label: t('members'), href: '/portal/my-company/members' },
    ]);
    fetchAll();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchAll, setBreadcrumbs, setPageTitle, t]);

  return (
    <section id="my-company-members-page" className="flex flex-col gap-4">
      <div className="flex justify-end">
        <MemberForm
          basePath={BASE_PATH}
          profiles={profiles}
          onSaved={fetchAll}
          trigger={<Button variant="secondary">{t('addMember')}</Button>}
        />
      </div>

      <MemberTable
        members={members}
        profiles={profiles}
        basePath={BASE_PATH}
        canManage
        currentUserId={user?.id}
        onChanged={fetchAll}
      />
    </section>
  );
}
