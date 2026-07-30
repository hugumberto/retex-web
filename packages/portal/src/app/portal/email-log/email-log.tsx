'use client';

import { EmailLogDTO, EmailLogStatus } from '@/app/types/email-log';
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
import { useAppStore } from '@/store';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

// Os tipos correspondem aos templates do backend; a ordem define o dropdown.
const EMAIL_TYPES = [
  'account-activation',
  'out-of-service-zone',
  'password-reset',
  'package-confirmation',
  'collection-confirmation',
  'collection-cancelled',
  'contact-form',
  'survey',
] as const;

export default function EmailLog() {
  const t = useTranslations('emailLog');
  const tCommon = useTranslations('common');
  const tType = useTranslations('enums.emailType');
  const tStatus = useTranslations('enums.emailStatus');
  const locale = useLocale();
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(locale);
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [logs, setLogs] = useState<EmailLogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros (aplicados no submit).
  const [type, setType] = useState('');
  const [recipient, setRecipient] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchLogs = useCallback(
    async (
      targetPage: number,
      filters: {
        type: string;
        recipient: string;
        from: string;
        to: string;
      } = { type, recipient, from, to }
    ) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: targetPage,
          limit: PAGE_SIZE,
        };
        if (filters.type) params.type = filters.type;
        if (filters.recipient) params.recipient = filters.recipient;
        // Datas enviadas como dia (YYYY-MM-DD); o backend normaliza para início
        // (from) e fim (to) do dia, tornando o intervalo inclusivo.
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;

        const { data } = await api.get<PaginatedResult<EmailLogDTO>>(
          '/email-log',
          { params }
        );
        setLogs(data.data);
        setTotal(data.meta.total);
        setPage(data.meta.page);
      } catch {
        toast.error(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [type, recipient, from, to, t]
  );

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/email-log' }]);
    fetchLogs(1);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageTitle, setBreadcrumbs]);

  const applyFilters = () => fetchLogs(1);

  const clearFilters = () => {
    setType('');
    setRecipient('');
    setFrom('');
    setTo('');
    // Passa filtros vazios explicitamente (o estado só atualiza no próximo render).
    fetchLogs(1, { type: '', recipient: '', from: '', to: '' });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">
              {tCommon('type')}
            </label>
            <select
              className="h-9 rounded-md border border-secondary/40 px-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">{tCommon('all')}</option>
              {EMAIL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {tType(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">
              {t('recipient')}
            </label>
            <Input
              placeholder={t('recipientPlaceholder')}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">
              {tCommon('from')}
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">
              {tCommon('to')}
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              onClick={applyFilters}
              disabled={isLoading}
            >
              {tCommon('filter')}
            </Button>
            <Button
              variant="ghost"
              onClick={clearFilters}
              disabled={isLoading}
            >
              {tCommon('clear')}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('type')}</TableHead>
                <TableHead>{t('recipient')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {tType(log.type)}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[220px]">
                      {log.recipient}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === EmailLogStatus.SENT
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                        title={log.error ?? undefined}
                      >
                        {tStatus(log.status)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.sentAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {isLoading ? tCommon('loading') : t('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-secondary">
          <span>
            {t('recordCount', { count: total })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => fetchLogs(page - 1)}
            >
              {tCommon('previous')}
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => fetchLogs(page + 1)}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
