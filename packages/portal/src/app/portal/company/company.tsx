'use client';

import { CompanyDTO, CompanyStatus } from '@/app/types/company';
import { PaginatedResult } from '@/app/types/helper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useAppStore } from '@/store';
import { UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import CompanyForm from './company-form';

export default function Company() {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const pagination = usePagination(companies);
  const [search, setSearch] = useState('');

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, status } = await api.get<PaginatedResult<CompanyDTO>>(
        `/company${search ? `?search=${encodeURIComponent(search)}` : ''}`
      );
      if (!isSuccessStatus(status)) throw new Error();
      setCompanies(data.data ?? []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [search]);

  // Título e breadcrumbs só à entrada e à saída do ecrã. Juntos com a busca,
  // como estavam, eram limpos e repostos a cada tecla escrita na pesquisa,
  // porque `fetchCompanies` muda sempre que `search` muda.
  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/company' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageTitle, setBreadcrumbs]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <section id="company-page" className="space-y-6">
      <div className="flex justify-end">
        <CompanyForm onSaved={fetchCompanies} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            className="max-w-xs"
            placeholder={tCommon('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('code')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('taxId')}</TableHead>
              <TableHead>{tCommon('email')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{tCommon('action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t('noCompanies')}
                </TableCell>
              </TableRow>
            ) : (
              pagination.items.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.friendlyCode ?? '-'}</TableCell>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.taxId}</TableCell>
                  <TableCell>{company.email ?? '-'}</TableCell>
                  <TableCell>
                    {company.status === CompanyStatus.ACTIVE
                      ? tCommon('active')
                      : tCommon('inactive')}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <CompanyForm company={company} onSaved={fetchCompanies} />
                    <Button asChild variant="ghost" size="icon" title={t('members')}>
                      <Link href={`/portal/company/${company.id}/members`}>
                        <UsersIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>

        <TablePagination pagination={pagination} />
      </div>
    </section>
  );
}
