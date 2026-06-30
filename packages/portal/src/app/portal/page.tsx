'use client';

import { PackageDTO } from '@/app/types/package';
import { Role } from '@/app/types/user';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { STATUS_CLASS, STATUS_LABEL } from '@/lib/package-status';
import { useAppStore } from '@/store';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Index() {
  const { setPageTitle, setBreadcrumbs, user } = useAppStore();
  const [requests, setRequests] = useState<PackageDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const isUserRole = user?.roles?.some((r) => r.role === Role.USER) ?? false;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PackageDTO[]>('/me/packages');
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Não foi possível carregar as solicitações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageTitle('');
    setBreadcrumbs([]);
    if (isUserRole) fetchRequests();
    return () => { setPageTitle(''); setBreadcrumbs([]); };
  }, [setPageTitle, setBreadcrumbs, isUserRole, fetchRequests]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Olá{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-sm text-muted-foreground">Bem-vindo ao portal Retex.</p>
      </div>

      {isUserRole && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <h2 className="text-lg font-semibold text-secondary mb-4">As minhas solicitações</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">A carregar...</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Morada</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          {[req.address?.street, req.address?.number]
                            .filter(Boolean)
                            .join(', ')}
                        </TableCell>
                        <TableCell>{req.address?.city ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[req.status] ?? 'bg-muted text-muted-foreground'}`}>
                            {STATUS_LABEL[req.status] ?? req.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Não tens solicitações de coleta.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
