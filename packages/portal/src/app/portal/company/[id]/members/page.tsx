'use client';

import { CompanyMemberDTO, CompanyProfileDTO } from '@/app/types/company';
import MemberForm from '@/components/company/member-form';
import MemberTable from '@/components/company/member-table';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CompanyMembersPage() {
  const t = useTranslations('company');
  const params = useParams<{ id: string }>();
  const { user, setPageTitle, setBreadcrumbs } = useAppStore();
  const [members, setMembers] = useState<CompanyMemberDTO[]>([]);
  const [profiles, setProfiles] = useState<CompanyProfileDTO[]>([]);

  // Os endpoints de admin e os de self-service são os mesmos use-cases na API —
  // muda só a forma de resolver a empresa. Daí a tabela e o formulário serem
  // partilhados, parametrizados por este caminho.
  const basePath = `/company/${params.id}`;

  const fetchAll = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([
        api.get<CompanyMemberDTO[]>(`${basePath}/members`),
        api.get<CompanyProfileDTO[]>(`${basePath}/profiles`),
      ]);
      if (!isSuccessStatus(m.status) || !isSuccessStatus(p.status)) {
        throw new Error();
      }
      setMembers(m.data ?? []);
      setProfiles(p.data ?? []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [basePath, t]);

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
  }, [fetchAll, params.id, setBreadcrumbs, setPageTitle, t]);

  return (
    <section id="company-members-page" className="flex flex-col gap-4">
      <div className="flex justify-end">
        <MemberForm
          basePath={basePath}
          profiles={profiles}
          onSaved={fetchAll}
          trigger={<Button variant="secondary">{t('addMember')}</Button>}
        />
      </div>

      <MemberTable
        members={members}
        profiles={profiles}
        basePath={basePath}
        canManage
        currentUserId={user?.id}
        onChanged={fetchAll}
      />
    </section>
  );
}
