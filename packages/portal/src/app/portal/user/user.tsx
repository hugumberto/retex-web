'use client';

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
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Role, UserDTO, UserStatus } from '../../types/user';
import UserForm from './user-form';
import ResetPasswordForm from './reset-password-form';

const ROLE_LABEL: Record<Role, string> = {
  [Role.USER]: 'Utilizador',
  [Role.DRIVER]: 'Motorista',
  [Role.OPS]: 'Operação',
  [Role.ADMIN]: 'Admin',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Ativo',
  [UserStatus.INACTIVE]: 'Inativo',
};

const ALL = 'ALL';

export default function User() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
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

  const clearFilters = useCallback(() => {
    setEmailQuery('');
    setRoleFilter(ALL);
    setStatusFilter(ALL);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data, status } = await api.get<UserDTO[]>('/user');
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao buscar utilizadores');
      }
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar utilizadores:', error);
      toast.error('Não foi possível carregar os utilizadores');
    }
  }, []);

  useEffect(() => {
    setPageTitle('Utilizador');
    setBreadcrumbs([{ label: 'Utilizador', href: '/portal/user' }]);
    fetchData();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchData, setBreadcrumbs, setPageTitle]);

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
          throw new Error('Erro ao eliminar utilizador');
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
        success: () => 'Utilizador eliminado com sucesso',
        error: () => 'Erro ao eliminar o utilizador',
      });
    },
    [handleDeleteUser]
  );

  return (
    <section id="user-page" className="flex flex-col items-center">
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Pesquisar por email"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as Role | typeof ALL)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os perfis</SelectItem>
              {Object.values(Role).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role]}
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
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {Object.values(UserStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
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
        <UserForm onSave={fetchData} />
      </div>

      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles
                      .map((role) => ROLE_LABEL[role.role] ?? role.role)
                      .join(', ')}
                  </TableCell>
                  <TableCell>{STATUS_LABEL[user.status] ?? user.status}</TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhum registro encontrado!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
