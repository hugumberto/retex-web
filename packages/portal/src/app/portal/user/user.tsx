'use client';

import { useTranslations } from 'next-intl';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isMaster, isPrivilegedUser } from '@/lib/access-control';
import { isSuccessStatus } from '@/lib/utils';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useAppStore } from '@/store';
import { TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Role, UserDTO, UserStatus } from '../../types/user';
import UserForm from './user-form';
import ResetPasswordForm from './reset-password-form';

// Endereço padrão do utilizador (ou o primeiro, como fallback).
const defaultAddress = (user: UserDTO) =>
  user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

const ALL = 'ALL';

export default function User() {
  const t = useTranslations('users');
  const tRole = useTranslations('enums.role');
  const tStatus = useTranslations('enums.userStatus');
  const tCommon = useTranslations('common');
  const { user: currentUser, setPageTitle, setBreadcrumbs } = useAppStore();
  // Contas ADMIN/MASTER só são geridas por um MASTER — a API recusa na mesma.
  const currentUserIsMaster = isMaster(currentUser);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailQuery, setEmailQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | typeof ALL>(ALL);
  const [statusFilter, setStatusFilter] = useState<UserStatus | typeof ALL>(ALL);

  const hasFilters =
    emailQuery.trim() !== '' || roleFilter !== ALL || statusFilter !== ALL;

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const q = emailQuery.trim().toLowerCase();
        const matchesEmail = !q || user.email.toLowerCase().includes(q);
        const matchesRole =
          roleFilter === ALL || user.roles.some((r) => r.role === roleFilter);
        const matchesStatus =
          statusFilter === ALL || user.status === statusFilter;
        return matchesEmail && matchesRole && matchesStatus;
      }),
    [users, emailQuery, roleFilter, statusFilter]
  );

  const pagination = usePagination(
    filteredUsers,
    `${emailQuery}|${roleFilter}|${statusFilter}`
  );

  const clearFilters = useCallback(() => {
    setEmailQuery('');
    setRoleFilter(ALL);
    setStatusFilter(ALL);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data, status } = await api.get<UserDTO[]>('/user');
      if (!isSuccessStatus(status)) {
        throw new Error(t('fetchError'));
      }
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar utilizadores:', error);
      toast.error(t('loadError'));
    }
  }, []);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/user' }]);
    fetchData();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchData, setBreadcrumbs, setPageTitle, t]);

  const handleDeleteUser = useCallback(
    async (user: UserDTO) => {
      setIsSubmitting(true);
      try {
        const res = await api.put(`/user/${user.id}`, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contactPhone: user.contactPhone,
          status: 'INACTIVE',
        });
        if (!isSuccessStatus(res.status)) {
          throw new Error(t('deleteError'));
        }
        await fetchData();
      } catch (error) {
        console.error('Erro ao eliminar utilizador:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchData]
  );

  const handleDeleteWithToast = useCallback(
    async (user: UserDTO) => {
      await toast.promise(handleDeleteUser(user), {
        loading: 'Carregando...',
        success: () => t('deleteSuccess'),
        error: () => t('deleteError'),
      });
    },
    [handleDeleteUser]
  );

  return (
    <section id="user-page" className="space-y-6">
      <div className="flex justify-end">
        <UserForm onSave={fetchData} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={t('searchByEmail')}
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as Role | typeof ALL)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={tCommon('role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('allRoles')}</SelectItem>
                {Object.values(Role).map((role) => (
                  <SelectItem key={role} value={role}>
                    {tRole(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as UserStatus | typeof ALL)
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
                {Object.values(UserStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {tStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{tCommon('email')}</TableHead>
                <TableHead>{tCommon('role')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{t('defaultCity')}</TableHead>
                <TableHead>{tCommon('createdAt')}</TableHead>
                <TableHead>{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.length > 0 ? (
                pagination.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.roles.map((role) => tRole(role.role)).join(', ')}
                    </TableCell>
                    <TableCell>{tStatus(user.status)}</TableCell>
                    <TableCell>
                      {(() => {
                        const addr = defaultAddress(user);
                        if (!addr) return '—';
                        return (
                          <div className="flex flex-col gap-1">
                            <span>{addr.city || '—'}</span>
                            {!addr.isInServiceZone && (
                              <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-800">
                                {t('outOfZone')}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('pt-PT')
                        : '—'}
                    </TableCell>

                    <TableCell className="space-x-2">
                      <UserForm
                        initialData={{
                          id: user.id,
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                          contactPhone: user.contactPhone,
                          role: user.roles.map((role) => role.role),
                        }}
                        onSave={fetchData}
                      />
                      {(currentUserIsMaster || !isPrivilegedUser(user)) && (
                        <>
                          <ResetPasswordForm user={user} />
                          <ConfirmDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                disabled={isSubmitting}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            }
                            onConfirm={() => handleDeleteWithToast(user)}
                          />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {tCommon('noRecords')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination pagination={pagination} />
      </div>
    </section>
  );
}
