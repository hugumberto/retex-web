'use client';

import { UserDTO, UserStatus } from '@/app/types/user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isPrivilegedUser } from '@/lib/access-control';
import api from '@/lib/api';
import { fetchCompanyContext } from '@/service/company';
import { useAppStore } from '@/store';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/**
 * Entrada do modo "ver como": o master escolhe um cliente e o portal passa a
 * mostrar o que esse cliente vê. Só os clientes aparecem — contas ADMIN/MASTER
 * são recusadas pela API, e as outras não têm dashboard próprio para ver.
 */
export default function ViewAsDialog() {
  const t = useTranslations('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<UserDTO[]>([]);
  const [query, setQuery] = useState('');
  const startImpersonation = useAppStore((state) => state.startImpersonation);
  const clearCompanyContext = useAppStore((state) => state.clearCompanyContext);

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get<UserDTO[]>('/user?role=USER');
      setClients(
        data.filter(
          (user) => user.status === UserStatus.ACTIVE && !isPrivilegedUser(user)
        )
      );
    } catch {
      toast.error(t('viewAsLoadError'));
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) fetchClients();
  }, [isOpen, fetchClients]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((user) =>
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(term)
    );
  }, [clients, query]);

  const handleSelect = async (user: UserDTO) => {
    startImpersonation(user);
    setIsOpen(false);
    setQuery('');
    // O contexto de empresa é do utilizador efetivo: sem revalidar, o menu e os
    // guards ficariam com as permissões do master.
    clearCompanyContext();
    await fetchCompanyContext();
    toast.success(t('viewAsStarted', { name: `${user.firstName} ${user.lastName}` }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Eye className="size-4" />
          {t('viewAs')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-secondary">{t('viewAsTitle')}</DialogTitle>
          <DialogDescription>{t('viewAsDescription')}</DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('viewAsSearch')}
          autoFocus
        />

        <div className="max-h-[45vh] overflow-y-auto">
          {filtered.length > 0 ? (
            <ul className="divide-y">
              {filtered.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelect(user)}
                  >
                    {t('viewAsAction')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('viewAsEmpty')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
