'use client';

import ConfirmDialog from '@/components/custom/confirmation-dialog';
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
import { TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserDTO } from '../../types/user';
import UserForm from './user-form';
import ResetPasswordForm from './reset-password-form';

export default function User() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <div className="w-full flex justify-end">
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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((role) => role.role).join(', ')}
                  </TableCell>
                  <TableCell>{user.status}</TableCell>

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
