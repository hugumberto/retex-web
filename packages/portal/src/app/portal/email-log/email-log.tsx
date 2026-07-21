'use client';

import {
  EmailLogDTO,
  EmailLogStatus,
  EMAIL_STATUS_LABEL,
  EMAIL_TYPE_LABEL,
} from '@/app/types/email-log';
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
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-PT');

export default function EmailLog() {
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
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: targetPage,
          limit: PAGE_SIZE,
        };
        if (type) params.type = type;
        if (recipient) params.recipient = recipient;
        if (from) params.from = new Date(from).toISOString();
        // `to` inclusivo até ao fim do dia selecionado.
        if (to) params.to = new Date(`${to}T23:59:59`).toISOString();

        const { data } = await api.get<PaginatedResult<EmailLogDTO>>(
          '/email-log',
          { params }
        );
        setLogs(data.data);
        setTotal(data.meta.total);
        setPage(data.meta.page);
      } catch {
        toast.error('Não foi possível carregar o registo de emails');
      } finally {
        setIsLoading(false);
      }
    },
    [type, recipient, from, to]
  );

  useEffect(() => {
    setPageTitle('Registo de Emails');
    setBreadcrumbs([{ label: 'Registo de Emails', href: '/portal/email-log' }]);
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
    // Refetch sem filtros no próximo tick (estado já limpo).
    setTimeout(() => fetchLogs(1), 0);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">Tipo</label>
            <select
              className="h-9 rounded-md border border-secondary/40 px-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(EMAIL_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">
              Destinatário
            </label>
            <Input
              placeholder="email@exemplo.pt"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">De</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-secondary">Até</label>
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
              Filtrar
            </Button>
            <Button
              variant="ghost"
              onClick={clearFilters}
              disabled={isLoading}
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {EMAIL_TYPE_LABEL[log.type] ?? log.type}
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
                        {EMAIL_STATUS_LABEL[log.status] ?? log.status}
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
                    {isLoading ? 'A carregar...' : 'Nenhum email registado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-secondary">
          <span>
            {total} registo{total === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => fetchLogs(page - 1)}
            >
              Anterior
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
              Seguinte
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
